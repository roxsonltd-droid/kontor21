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

  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const usdc = await TestUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("TestUSDC deployed to:", usdcAddress);

  await usdc.mint(deployer.address, ethers.parseUnits("1000000", 6));
  console.log("Minted 1,000,000 USDC to deployer");

  const KontorEscrow = await ethers.getContractFactory("KontorEscrow");
  const escrow = await KontorEscrow.deploy(deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("KontorEscrow deployed to:", escrowAddress);

  const addresses = {
    testUSDC: usdcAddress,
    kontorEscrow: escrowAddress,
    arbitrator: deployer.address,
  };

  fs.writeFileSync(
    path.join(__dirname, "..", "contract-addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
  console.log("\nAddresses written to contract-addresses.json");

  console.log("\nDeployment Summary:");
  console.log("  TestUSDC:", usdcAddress);
  console.log("  KontorEscrow:", escrowAddress);
  console.log("  Arbitrator/Owner:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
