// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KontorEscrow
 * @dev Escrow smart contract for agricultural B2B trade.
 * V2 Nexus Core: Supports partial payments and 2-of-3 Multisig Arbitration.
 */
contract KontorEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

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
        address oracle; // Server Rules Engine address
        uint256 totalAmount;
        uint256 releasedAmount;
        IERC20 token;
        TradeStatus status;
        
        // Multisig arbitration state
        uint8 votesForBuyer;
        uint8 votesForSeller;
    }

    // Mapping from tradeId to Trade
    mapping(uint256 => Trade) public trades;
    
    // Mapping from tradeId to arbitrator address to whether they have voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    uint256 public nextTradeId = 1;

    // 3 Arbitrators for 2-of-3 Multisig Resolution
    address[3] public arbitrators;

    address public feeTreasury;
    uint256 public feeBasisPoints;

    event TradeCreated(uint256 indexed tradeId, address indexed buyer, address indexed seller, uint256 amount);
    event TradeFunded(uint256 indexed tradeId);
    event TradePartialReleased(uint256 indexed tradeId, uint256 amount);
    event TradeCompleted(uint256 indexed tradeId);
    event DisputeRaised(uint256 indexed tradeId, address raisedBy);
    event ArbitratorVoted(uint256 indexed tradeId, address arbitrator, bool refundBuyer);
    event DisputeResolved(uint256 indexed tradeId, bool refundBuyer);

    modifier onlyBuyer(uint256 _tradeId) {
        require(msg.sender == trades[_tradeId].buyer, "Not the buyer");
        _;
    }

    modifier onlyOracle(uint256 _tradeId) {
        require(msg.sender == trades[_tradeId].oracle, "Not the designated oracle");
        _;
    }

    modifier isArbitrator() {
        require(msg.sender == arbitrators[0] || msg.sender == arbitrators[1] || msg.sender == arbitrators[2], "Not an arbitrator");
        _;
    }

    constructor(
        address _arb1, 
        address _arb2, 
        address _arb3, 
        address _feeTreasury, 
        uint256 _feeBasisPoints
    ) Ownable(msg.sender) {
        require(_feeTreasury != address(0), "Invalid treasury");
        require(_feeBasisPoints <= 1000, "Fee cannot exceed 10%");
        arbitrators[0] = _arb1;
        arbitrators[1] = _arb2;
        arbitrators[2] = _arb3;
        feeTreasury = _feeTreasury;
        feeBasisPoints = _feeBasisPoints;
    }

    function createTrade(
        address _buyer,
        address _oracle,
        uint256 _amount,
        address _tokenAddress
    ) external returns (uint256) {
        require(_buyer != address(0), "Invalid buyer address");
        require(_oracle != address(0), "Invalid oracle address");
        require(_amount > 0, "Amount must be greater than 0");

        uint256 tradeId = nextTradeId++;
        
        trades[tradeId] = Trade({
            buyer: _buyer,
            seller: msg.sender,
            oracle: _oracle,
            totalAmount: _amount,
            releasedAmount: 0,
            token: IERC20(_tokenAddress),
            status: TradeStatus.AWAITING_FUNDS,
            votesForBuyer: 0,
            votesForSeller: 0
        });

        emit TradeCreated(tradeId, _buyer, msg.sender, _amount);
        return tradeId;
    }

    function fundTrade(uint256 _tradeId) external onlyBuyer(_tradeId) nonReentrant {
        Trade storage trade = trades[_tradeId];
        require(trade.status == TradeStatus.AWAITING_FUNDS, "Trade is not awaiting funds");

        trade.status = TradeStatus.FUNDED;
        trade.token.safeTransferFrom(msg.sender, address(this), trade.totalAmount);
        emit TradeFunded(_tradeId);
    }

    /**
     * @dev Rules Engine (Oracle) releases partial or full funds based on milestones.
     */
    function releaseFunds(uint256 _tradeId, uint256 _amount) external onlyOracle(_tradeId) nonReentrant {
        Trade storage trade = trades[_tradeId];
        require(trade.status == TradeStatus.FUNDED, "Trade is not funded or is disputed");
        require(_amount > 0, "Amount must be > 0");
        require(trade.releasedAmount + _amount <= trade.totalAmount, "Exceeds total amount");

        trade.releasedAmount += _amount;

        uint256 feeAmount = (_amount * feeBasisPoints) / 10000;
        uint256 sellerAmount = _amount - feeAmount;

        if (feeAmount > 0) {
            trade.token.safeTransfer(feeTreasury, feeAmount);
        }
        trade.token.safeTransfer(trade.seller, sellerAmount);

        if (trade.releasedAmount == trade.totalAmount) {
            trade.status = TradeStatus.COMPLETED;
            emit TradeCompleted(_tradeId);
        } else {
            emit TradePartialReleased(_tradeId, _amount);
        }
    }

    function raiseDispute(uint256 _tradeId) external nonReentrant {
        Trade storage trade = trades[_tradeId];
        require(msg.sender == trade.buyer || msg.sender == trade.seller, "Not part of trade");
        require(trade.status == TradeStatus.FUNDED, "Can only dispute active funded trades");

        trade.status = TradeStatus.DISPUTED;
        emit DisputeRaised(_tradeId, msg.sender);
    }

    /**
     * @dev Arbitrators vote. 2 votes required to resolve.
     */
    function voteDispute(uint256 _tradeId, bool refundBuyer) external isArbitrator nonReentrant {
        Trade storage trade = trades[_tradeId];
        require(trade.status == TradeStatus.DISPUTED, "Trade is not in dispute");
        require(!hasVoted[_tradeId][msg.sender], "Arbitrator already voted");

        hasVoted[_tradeId][msg.sender] = true;
        
        if (refundBuyer) {
            trade.votesForBuyer++;
        } else {
            trade.votesForSeller++;
        }
        
        emit ArbitratorVoted(_tradeId, msg.sender, refundBuyer);

        uint256 remainingAmount = trade.totalAmount - trade.releasedAmount;

        // Check if 2-of-3 consensus reached
        if (trade.votesForBuyer >= 2) {
            trade.status = TradeStatus.REFUNDED;
            trade.token.safeTransfer(trade.buyer, remainingAmount);
            emit DisputeResolved(_tradeId, true);
        } else if (trade.votesForSeller >= 2) {
            trade.status = TradeStatus.COMPLETED;
            uint256 feeAmount = (remainingAmount * feeBasisPoints) / 10000;
            uint256 sellerAmount = remainingAmount - feeAmount;

            if (feeAmount > 0) {
                trade.token.safeTransfer(feeTreasury, feeAmount);
            }
            trade.token.safeTransfer(trade.seller, sellerAmount);
            emit DisputeResolved(_tradeId, false);
        }
    }

    function setArbitrators(address[3] calldata _newArbitrators) external onlyOwner {
        require(_newArbitrators[0] != address(0) && _newArbitrators[1] != address(0) && _newArbitrators[2] != address(0), "Invalid arbitrators");
        arbitrators = _newArbitrators;
    }
}
