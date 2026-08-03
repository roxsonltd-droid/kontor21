// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KontorEscrow
 * @notice Testnet settlement adapter for Kontor21 trades.
 * @dev V3 requires an oracle proposal plus explicit buyer approval before
 * releasing any milestone. Arbitrators and deadlines are snapshotted per trade.
 */
contract KontorEscrow is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant FUNDING_WINDOW = 7 days;
    uint256 public constant RELEASE_WINDOW = 30 days;
    uint256 public constant DISPUTE_WINDOW = 30 days;

    enum TradeStatus {
        AWAITING_FUNDS,
        FUNDED,
        COMPLETED,
        DISPUTED,
        REFUNDED
    }

    struct Trade {
        address buyer;
        address seller;
        address oracle;
        uint256 totalAmount;
        uint256 releasedAmount;
        IERC20 token;
        TradeStatus status;
        uint8 votesForBuyer;
        uint8 votesForSeller;
    }

    mapping(uint256 => Trade) public trades;
    mapping(uint256 => address[3]) public tradeArbitrators;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public allowedTokens;
    mapping(uint256 => uint64) public fundingDeadlines;
    mapping(uint256 => uint64) public releaseDeadlines;
    mapping(uint256 => uint64) public disputeDeadlines;
    mapping(uint256 => uint256) public pendingReleaseAmounts;
    mapping(uint256 => bytes32) public pendingEvidenceRoots;

    uint256 public nextTradeId = 1;
    address[3] public arbitrators;
    address public feeTreasury;
    uint256 public feeBasisPoints;

    event TradeCreated(
        uint256 indexed tradeId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 fundingDeadline
    );
    event TradeFunded(uint256 indexed tradeId, uint256 releaseDeadline);
    event ReleaseProposed(uint256 indexed tradeId, uint256 amount, bytes32 indexed evidenceRoot);
    event ReleaseApproved(uint256 indexed tradeId, address indexed buyer, uint256 amount, bytes32 indexed evidenceRoot);
    event TradePartialReleased(uint256 indexed tradeId, uint256 amount);
    event TradeCompleted(uint256 indexed tradeId);
    event TradeTimedOut(uint256 indexed tradeId, uint256 refundedAmount);
    event DisputeRaised(uint256 indexed tradeId, address raisedBy);
    event DisputeTimedOut(uint256 indexed tradeId, uint256 refundedAmount);
    event ArbitratorVoted(uint256 indexed tradeId, address arbitrator, bool refundBuyer);
    event DisputeResolved(uint256 indexed tradeId, bool refundBuyer);
    event DefaultArbitratorsUpdated(address indexed arb1, address indexed arb2, address indexed arb3);
    event TokenAllowlistUpdated(address indexed token, bool allowed);

    modifier onlyBuyer(uint256 tradeId) {
        require(msg.sender == trades[tradeId].buyer, "Not the buyer");
        _;
    }

    modifier onlyOracle(uint256 tradeId) {
        require(msg.sender == trades[tradeId].oracle, "Not the designated oracle");
        _;
    }

    modifier isTradeArbitrator(uint256 tradeId) {
        address[3] storage panel = tradeArbitrators[tradeId];
        require(
            msg.sender == panel[0] || msg.sender == panel[1] || msg.sender == panel[2],
            "Not a trade arbitrator"
        );
        _;
    }

    constructor(
        address arb1,
        address arb2,
        address arb3,
        address treasury,
        uint256 fees,
        address initialToken
    ) Ownable(msg.sender) {
        _validateArbitrators(arb1, arb2, arb3);
        require(treasury != address(0), "Invalid treasury");
        require(fees <= 1000, "Fee cannot exceed 10%");
        require(initialToken != address(0) && initialToken.code.length > 0, "Invalid initial token");

        arbitrators = [arb1, arb2, arb3];
        feeTreasury = treasury;
        feeBasisPoints = fees;
        allowedTokens[initialToken] = true;

        emit DefaultArbitratorsUpdated(arb1, arb2, arb3);
        emit TokenAllowlistUpdated(initialToken, true);
    }

    function createTrade(
        address buyer,
        address oracle,
        uint256 amount,
        address tokenAddress
    ) external whenNotPaused returns (uint256 tradeId) {
        require(buyer != address(0), "Invalid buyer address");
        require(oracle != address(0), "Invalid oracle address");
        require(amount > 0, "Amount must be greater than 0");
        require(tokenAddress != address(0), "Invalid token address");
        require(allowedTokens[tokenAddress], "Token not allowed");

        tradeId = nextTradeId++;
        uint64 fundingDeadline = uint64(block.timestamp + FUNDING_WINDOW);

        trades[tradeId] = Trade({
            buyer: buyer,
            seller: msg.sender,
            oracle: oracle,
            totalAmount: amount,
            releasedAmount: 0,
            token: IERC20(tokenAddress),
            status: TradeStatus.AWAITING_FUNDS,
            votesForBuyer: 0,
            votesForSeller: 0
        });
        fundingDeadlines[tradeId] = fundingDeadline;
        tradeArbitrators[tradeId] = arbitrators;

        emit TradeCreated(tradeId, buyer, msg.sender, amount, fundingDeadline);
    }

    function fundTrade(uint256 tradeId)
        external
        onlyBuyer(tradeId)
        whenNotPaused
        nonReentrant
    {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.AWAITING_FUNDS, "Trade is not awaiting funds");
        require(block.timestamp <= fundingDeadlines[tradeId], "Funding deadline passed");

        uint256 balanceBefore = trade.token.balanceOf(address(this));
        trade.status = TradeStatus.FUNDED;
        releaseDeadlines[tradeId] = uint64(block.timestamp + RELEASE_WINDOW);
        trade.token.safeTransferFrom(msg.sender, address(this), trade.totalAmount);
        require(
            trade.token.balanceOf(address(this)) - balanceBefore == trade.totalAmount,
            "Unsupported fee-on-transfer token"
        );

        emit TradeFunded(tradeId, releaseDeadlines[tradeId]);
    }

    /**
     * @notice Oracle proposes a milestone release tied to an off-chain evidence root.
     * No funds move until the buyer separately approves the exact proposal.
     */
    function proposeRelease(uint256 tradeId, uint256 amount, bytes32 evidenceRoot)
        external
        onlyOracle(tradeId)
        whenNotPaused
    {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.FUNDED, "Trade is not funded or is disputed");
        require(block.timestamp <= releaseDeadlines[tradeId], "Release deadline passed");
        require(amount > 0, "Amount must be > 0");
        require(trade.releasedAmount + amount <= trade.totalAmount, "Exceeds total amount");
        require(evidenceRoot != bytes32(0), "Evidence root required");

        pendingReleaseAmounts[tradeId] = amount;
        pendingEvidenceRoots[tradeId] = evidenceRoot;
        emit ReleaseProposed(tradeId, amount, evidenceRoot);
    }

    function approveRelease(uint256 tradeId, uint256 expectedAmount, bytes32 expectedEvidenceRoot)
        external
        onlyBuyer(tradeId)
        whenNotPaused
        nonReentrant
    {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.FUNDED, "Trade is not funded or is disputed");
        require(block.timestamp <= releaseDeadlines[tradeId], "Release deadline passed");

        uint256 amount = pendingReleaseAmounts[tradeId];
        bytes32 evidenceRoot = pendingEvidenceRoots[tradeId];
        require(amount > 0 && evidenceRoot != bytes32(0), "No pending release");
        require(amount == expectedAmount, "Release amount changed");
        require(evidenceRoot == expectedEvidenceRoot, "Evidence root changed");

        pendingReleaseAmounts[tradeId] = 0;
        pendingEvidenceRoots[tradeId] = bytes32(0);
        trade.releasedAmount += amount;
        _paySeller(trade, amount);

        emit ReleaseApproved(tradeId, msg.sender, amount, evidenceRoot);
        if (trade.releasedAmount == trade.totalAmount) {
            trade.status = TradeStatus.COMPLETED;
            emit TradeCompleted(tradeId);
        } else {
            emit TradePartialReleased(tradeId, amount);
        }
    }

    function claimTimeoutRefund(uint256 tradeId)
        external
        onlyBuyer(tradeId)
        nonReentrant
    {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.FUNDED, "Trade is not refundable");
        require(block.timestamp > releaseDeadlines[tradeId], "Release deadline active");

        uint256 remainingAmount = trade.totalAmount - trade.releasedAmount;
        trade.status = TradeStatus.REFUNDED;
        pendingReleaseAmounts[tradeId] = 0;
        pendingEvidenceRoots[tradeId] = bytes32(0);
        trade.token.safeTransfer(trade.buyer, remainingAmount);

        emit TradeTimedOut(tradeId, remainingAmount);
    }

    function raiseDispute(uint256 tradeId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        require(msg.sender == trade.buyer || msg.sender == trade.seller, "Not part of trade");
        require(trade.status == TradeStatus.FUNDED, "Can only dispute active funded trades");

        trade.status = TradeStatus.DISPUTED;
        disputeDeadlines[tradeId] = uint64(block.timestamp + DISPUTE_WINDOW);
        pendingReleaseAmounts[tradeId] = 0;
        pendingEvidenceRoots[tradeId] = bytes32(0);
        emit DisputeRaised(tradeId, msg.sender);
    }

    /**
     * @notice Returns the unresolved balance to the buyer if the arbitrator panel
     * fails to reach a majority before the dispute deadline.
     */
    function claimDisputeTimeoutRefund(uint256 tradeId)
        external
        onlyBuyer(tradeId)
        nonReentrant
    {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.DISPUTED, "Trade is not disputed");
        require(block.timestamp > disputeDeadlines[tradeId], "Dispute deadline active");

        uint256 remainingAmount = trade.totalAmount - trade.releasedAmount;
        trade.status = TradeStatus.REFUNDED;
        trade.token.safeTransfer(trade.buyer, remainingAmount);

        emit DisputeTimedOut(tradeId, remainingAmount);
    }

    function voteDispute(uint256 tradeId, bool refundBuyer)
        external
        isTradeArbitrator(tradeId)
        nonReentrant
    {
        Trade storage trade = trades[tradeId];
        require(trade.status == TradeStatus.DISPUTED, "Trade is not in dispute");
        require(!hasVoted[tradeId][msg.sender], "Arbitrator already voted");

        hasVoted[tradeId][msg.sender] = true;
        if (refundBuyer) {
            trade.votesForBuyer++;
        } else {
            trade.votesForSeller++;
        }
        emit ArbitratorVoted(tradeId, msg.sender, refundBuyer);

        uint256 remainingAmount = trade.totalAmount - trade.releasedAmount;
        if (trade.votesForBuyer >= 2) {
            trade.status = TradeStatus.REFUNDED;
            trade.token.safeTransfer(trade.buyer, remainingAmount);
            emit DisputeResolved(tradeId, true);
        } else if (trade.votesForSeller >= 2) {
            trade.status = TradeStatus.COMPLETED;
            _paySeller(trade, remainingAmount);
            emit DisputeResolved(tradeId, false);
        }
    }

    /**
     * @dev Updates the default panel for future trades only. Existing trade
     * panels remain immutable in tradeArbitrators.
     */
    function setArbitrators(address[3] calldata newArbitrators) external onlyOwner {
        _validateArbitrators(newArbitrators[0], newArbitrators[1], newArbitrators[2]);
        arbitrators = newArbitrators;
        emit DefaultArbitratorsUpdated(newArbitrators[0], newArbitrators[1], newArbitrators[2]);
    }

    function setTokenAllowed(address token, bool allowed) external onlyOwner {
        require(token != address(0) && token.code.length > 0, "Invalid token");
        allowedTokens[token] = allowed;
        emit TokenAllowlistUpdated(token, allowed);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _paySeller(Trade storage trade, uint256 amount) private {
        uint256 feeAmount = (amount * feeBasisPoints) / 10000;
        if (feeAmount > 0) trade.token.safeTransfer(feeTreasury, feeAmount);
        trade.token.safeTransfer(trade.seller, amount - feeAmount);
    }

    function _validateArbitrators(address arb1, address arb2, address arb3) private pure {
        require(arb1 != address(0) && arb2 != address(0) && arb3 != address(0), "Invalid arbitrators");
        require(arb1 != arb2 && arb1 != arb3 && arb2 != arb3, "Arbitrators must be unique");
    }
}
