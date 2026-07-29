// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KontorEscrow
 * @dev Escrow smart contract for agricultural B2B trade.
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
        address oracle; // e.g. SGS Inspector
        uint256 amount;
        IERC20 token;
        TradeStatus status;
        string conditionDescription;
    }

    // Mapping from tradeId to Trade
    mapping(uint256 => Trade) public trades;
    
    // Auto-incrementing trade ID
    uint256 public nextTradeId = 1;

    // The platform's arbitrator address
    address public arbitrator;

    event TradeCreated(uint256 indexed tradeId, address indexed buyer, address indexed seller, uint256 amount);
    event TradeFunded(uint256 indexed tradeId);
    event TradeApproved(uint256 indexed tradeId);
    event DisputeRaised(uint256 indexed tradeId, address raisedBy);
    event DisputeResolved(uint256 indexed tradeId, bool refundBuyer);

    modifier onlyBuyer(uint256 _tradeId) {
        require(msg.sender == trades[_tradeId].buyer, "Not the buyer");
        _;
    }

    modifier onlySeller(uint256 _tradeId) {
        require(msg.sender == trades[_tradeId].seller, "Not the seller");
        _;
    }

    modifier onlyOracle(uint256 _tradeId) {
        require(msg.sender == trades[_tradeId].oracle, "Not the designated oracle");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Not the arbitrator");
        _;
    }

    constructor(address _arbitrator) Ownable(msg.sender) {
        arbitrator = _arbitrator;
    }

    /**
     * @dev Creates a new escrow contract. Usually called by the Seller.
     */
    function createTrade(
        address _buyer,
        address _oracle,
        uint256 _amount,
        address _tokenAddress,
        string memory _conditionDescription
    ) external returns (uint256) {
        require(_buyer != address(0), "Invalid buyer address");
        require(_oracle != address(0), "Invalid oracle address");
        require(_amount > 0, "Amount must be greater than 0");

        uint256 tradeId = nextTradeId++;
        
        trades[tradeId] = Trade({
            buyer: _buyer,
            seller: msg.sender,
            oracle: _oracle,
            amount: _amount,
            token: IERC20(_tokenAddress),
            status: TradeStatus.AWAITING_FUNDS,
            conditionDescription: _conditionDescription
        });

        emit TradeCreated(tradeId, _buyer, msg.sender, _amount);
        return tradeId;
    }

    /**
     * @dev Buyer deposits the required tokens into the contract.
     * Note: Buyer must have called approve() on the token contract first.
     */
    function fundTrade(uint256 _tradeId) external onlyBuyer(_tradeId) nonReentrant {
        Trade storage trade = trades[_tradeId];
        require(trade.status == TradeStatus.AWAITING_FUNDS, "Trade is not awaiting funds");

        trade.status = TradeStatus.FUNDED;
        
        // Transfer tokens from buyer to this contract
        trade.token.safeTransferFrom(msg.sender, address(this), trade.amount);

        emit TradeFunded(_tradeId);
    }

    /**
     * @dev Oracle (e.g. SGS) confirms the conditions are met and unlocks the funds to the seller.
     */
    function approveTradeByOracle(uint256 _tradeId) external onlyOracle(_tradeId) nonReentrant {
        Trade storage trade = trades[_tradeId];
        require(trade.status == TradeStatus.FUNDED, "Trade is not funded yet");

        trade.status = TradeStatus.COMPLETED;

        // Release funds to seller
        trade.token.safeTransfer(trade.seller, trade.amount);

        emit TradeApproved(_tradeId);
    }

    /**
     * @dev Either buyer or seller can raise a dispute to freeze the funds.
     */
    function raiseDispute(uint256 _tradeId) external nonReentrant {
        Trade storage trade = trades[_tradeId];
        require(msg.sender == trade.buyer || msg.sender == trade.seller, "Not part of trade");
        require(trade.status == TradeStatus.FUNDED, "Can only dispute funded trades");

        trade.status = TradeStatus.DISPUTED;
        
        emit DisputeRaised(_tradeId, msg.sender);
    }

    /**
     * @dev Arbitrator resolves the dispute.
     * @param refundBuyer If true, funds go back to buyer. If false, funds go to seller.
     */
    function resolveDispute(uint256 _tradeId, bool refundBuyer) external onlyArbitrator nonReentrant {
        Trade storage trade = trades[_tradeId];
        require(trade.status == TradeStatus.DISPUTED, "Trade is not in dispute");

        if (refundBuyer) {
            trade.status = TradeStatus.REFUNDED;
            trade.token.safeTransfer(trade.buyer, trade.amount);
        } else {
            trade.status = TradeStatus.COMPLETED;
            trade.token.safeTransfer(trade.seller, trade.amount);
        }

        emit DisputeResolved(_tradeId, refundBuyer);
    }

    /**
     * @dev Admin function to update the arbitrator address
     */
    function setArbitrator(address _newArbitrator) external onlyOwner {
        require(_newArbitrator != address(0), "Invalid address");
        arbitrator = _newArbitrator;
    }
}
