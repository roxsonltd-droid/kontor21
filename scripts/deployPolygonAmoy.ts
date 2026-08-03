import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Define 3 arbitrators (in production these would be separate controlled wallets)
  const arb1 = deployer.address;
  const arb2 = "0x2222222222222222222222222222222222222222";
  const arb3 = "0x3333333333333333333333333333333333333333";

  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const usdc = await TestUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("TestUSDC deployed to:", usdcAddress);

  await usdc.mint(deployer.address, ethers.parseUnits("1000000", 6));
  console.log("Minted 1,000,000 USDC to deployer");

  const KontorEscrow = await ethers.getContractFactory("KontorEscrow");
  const feeTreasury = deployer.address; // For demo, deployer is treasury
  const feeBasisPoints = 25; // 0.25%
  
  // Pass 3 arbitrators instead of 1
  const escrow = await KontorEscrow.deploy(arb1, arb2, arb3, feeTreasury, feeBasisPoints);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("KontorEscrow deployed to:", escrowAddress);

  const addresses = {
    testUSDC: usdcAddress,
    kontorEscrow: escrowAddress,
    arbitrator1: arb1,
    arbitrator2: arb2,
    arbitrator3: arb3,
  };

  const dest = path.join(__dirname, "..", "contract-addresses.json");
  fs.writeFileSync(dest, JSON.stringify(addresses, null, 2));
  console.log("\nAddresses written to", dest);

  console.log("\nDeployment Summary:");
  console.log("  TestUSDC:", usdcAddress);
  console.log("  KontorEscrow:", escrowAddress);
  console.log("  Arbitrator 1 (Owner):", arb1);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
