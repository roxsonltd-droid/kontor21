// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDC
 * @dev Mock stablecoin for local testing of Kontor 21 platform
 */
contract TestUSDC is ERC20, Ownable {
    constructor() ERC20("USD Coin (Test)", "USDC") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    // To replicate real USDC (6 decimals)
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
