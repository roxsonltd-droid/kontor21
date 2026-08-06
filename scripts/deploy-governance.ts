import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { ethers } = hre;

const ZERO_ADDRESS = ethers.ZeroAddress;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying governance with account:", deployer.address);

  const configuredArbitrators = (process.env.ARBITRATOR_WALLETS || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  const localSigners = await ethers.getSigners();
  const controlled = configuredArbitrators.length === 3
    ? configuredArbitrators
    : localSigners.slice(0, 3).map((signer) => signer.address);

  const minDelay = Number(process.env.GOVERNANCE_MIN_DELAY_SECONDS || 2 * 24 * 60 * 60);

  // The three controlled wallets are the arbitration panel and now the
  // governance proposers. The deployer retains the executor role so scheduled
  // operations can be executed after the delay; a deployed Gnosis Safe (multisig)
  // can be substituted for the executor role before real funds are used.
  const proposers = controlled.filter((address) => address.toLowerCase() !== deployer.address.toLowerCase());
  const executor = deployer.address;

  console.log("Timelock delay (seconds):", minDelay);

  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(
    minDelay,
    proposers,
    [executor], // executors may execute once a scheduled operation is ready
    ZERO_ADDRESS // admin = zero revoked immediately; proposers/executors are fixed
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("TimelockController deployed to:", timelockAddress);
  console.log("  proposers:", proposers.join(", "));
  console.log("  executor:", executor);

  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const usdc = await TestUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  await usdc.mint(deployer.address, ethers.parseUnits("1000000", 6));
  console.log("TestUSDC deployed to:", usdcAddress);

  const KontorEscrow = await ethers.getContractFactory("KontorEscrow");
  const escrow = await KontorEscrow.deploy(
    controlled[0],
    controlled[1],
    controlled[2],
    deployer.address,
    25,
    usdcAddress
  );
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("KontorEscrow deployed to:", escrowAddress);

  console.log("Transferring escrow ownership to timelock...");
  await (await escrow.transferOwnership(timelockAddress)).wait();
  const newOwner = await escrow.owner();
  if (newOwner.toLowerCase() !== timelockAddress.toLowerCase()) {
    throw new Error("Ownership transfer to timelock failed");
  }
  console.log("Escrow owner is now:", newOwner);

  const gov = {
    timelock: timelockAddress,
    minDelaySeconds: minDelay,
    proposers,
    executor,
    deployer: deployer.address,
  };

  const addresses = {
    testUSDC: usdcAddress,
    kontorEscrow: escrowAddress,
    timelock: timelockAddress,
    arbitrator1: controlled[0],
    arbitrator2: controlled[1],
    arbitrator3: controlled[2],
    governance: gov,
  };

  const destinations = [
    path.join(__dirname, "..", "contract-addresses.json"),
    path.join(__dirname, "..", "lib", "contract-addresses.json"),
  ];
  for (const destination of destinations) {
    fs.writeFileSync(destination, JSON.stringify(addresses, null, 2));
    console.log("\nAddresses written to", destination);
  }

  console.log("\nDeployment Summary:");
  console.log("  TestUSDC:", usdcAddress);
  console.log("  KontorEscrow:", escrowAddress);
  console.log("  TimelockController:", timelockAddress);
  console.log("  Owner of escrow:", newOwner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});