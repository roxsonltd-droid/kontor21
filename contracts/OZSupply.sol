// SPDX-License-Identifier: MIT
// Re-exports OpenZeppelin's TimelockController so Hardhat compiles it into the
// contract set used by deploy-governance.ts and tests.
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";