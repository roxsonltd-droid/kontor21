const { ethers } = require("hardhat");

async function main() {
  console.log("Starting Kontor21 End-to-End Amoy Test...");

  const [deployer, buyer, seller, oracle] = await ethers.getSigners();
  
  console.log("Accounts:");
  console.log("Deployer:", deployer.address);
  console.log("Buyer:", buyer.address);
  console.log("Seller:", seller.address);
  console.log("Oracle (Rules Engine):", oracle.address);

  // 1. Deploy Test USDC
  const USDC = await ethers.getContractFactory("TestUSDC");
  const usdc = await USDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`\nTest USDC deployed to: ${usdcAddress}`);

  // 2. Deploy Escrow Contract
  const Escrow = await ethers.getContractFactory("KontorEscrow");
  const escrow = await Escrow.deploy(usdcAddress, [deployer.address, oracle.address, seller.address]); // mock arbitrators for testing
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`KontorEscrow deployed to: ${escrowAddress}`);

  // 3. Setup: Mint and Approve USDC for Buyer
  const tradeAmount = ethers.parseUnits("75000", 6);
  console.log(`\nMinting ${ethers.formatUnits(tradeAmount, 6)} USDC to Buyer...`);
  await usdc.mint(buyer.address, tradeAmount);
  
  console.log("Buyer approving Escrow contract...");
  await usdc.connect(buyer).approve(escrowAddress, tradeAmount);

  // 4. Create Trade
  console.log("\nCreating Trade (Seller initiates)...");
  const createTx = await escrow.connect(seller).createTrade(
    buyer.address,
    oracle.address,
    tradeAmount,
    usdcAddress
  );
  await createTx.wait();
  
  const tradeId = 1; // Assuming it's the first trade
  console.log(`Trade #${tradeId} created.`);

  // 5. Fund Trade (Buyer)
  console.log("\nBuyer funding trade...");
  const fundTx = await escrow.connect(buyer).fundTrade(tradeId);
  await fundTx.wait();
  console.log("Trade funded!");

  // 6. Partial Release (Rules Engine / Oracle)
  const partialAmount = ethers.parseUnits("25000", 6);
  console.log(`\nOracle releasing partial amount: ${ethers.formatUnits(partialAmount, 6)} USDC...`);
  const releaseTx = await escrow.connect(oracle).releaseFunds(tradeId, partialAmount);
  await releaseTx.wait();
  console.log("Partial funds released to Seller.");

  // 7. Dispute & Resolution (Multisig)
  console.log("\nRaising dispute...");
  const disputeTx = await escrow.connect(buyer).raiseDispute(tradeId);
  await disputeTx.wait();
  console.log("Dispute raised.");

  console.log("\nArbitrators voting on dispute (Refund Buyer)...");
  const vote1Tx = await escrow.connect(deployer).voteDispute(tradeId, true);
  await vote1Tx.wait();
  console.log("Vote 1 recorded (Deployer).");

  const vote2Tx = await escrow.connect(oracle).voteDispute(tradeId, true);
  await vote2Tx.wait();
  console.log("Vote 2 recorded (Oracle). Resolution triggered!");

  const trade = await escrow.getTrade(tradeId);
  console.log(`\nFinal Trade Status: ${trade.status} (4 = REFUNDED)`);
  console.log("E2E Test Completed Successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
