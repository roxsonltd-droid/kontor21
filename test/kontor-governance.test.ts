import { expect } from "chai";
import hre from "hardhat";

// Verifies the governance wiring: a TimelockController becomes the escrow
// owner, so ownership-sensitive actions (pause, token allowlist, panel
// changes) require a scheduled timelock transaction rather than a single key.
describe("KontorEscrow governance (timelock owner)", function () {
  async function governanceFixture() {
    const [deployer, seller, buyer, oracle, arb2, arb3, other] = await hre.ethers.getSigners();

    const TestUSDC = await hre.ethers.getContractFactory("TestUSDC");
    const usdc = await TestUSDC.deploy();
    await usdc.waitForDeployment();

    const TimelockController = await hre.ethers.getContractFactory("TimelockController");
    const proposer = deployer.address;
    const executor = deployer.address;
    const timelock = await TimelockController.deploy(
      2 * 24 * 60 * 60, // 2 days
      [proposer],
      [executor],
      hre.ethers.ZeroAddress
    );
    await timelock.waitForDeployment();

    const KontorEscrow = await hre.ethers.getContractFactory("KontorEscrow");
    const escrow = await KontorEscrow.deploy(
      oracle.address,
      arb2.address,
      arb3.address,
      deployer.address,
      25,
      await usdc.getAddress()
    );
    await escrow.waitForDeployment();

    await (await escrow.transferOwnership(await timelock.getAddress())).wait();

    return { usdc, escrow, timelock, deployer, seller, buyer, oracle, arb2, arb3, other };
  }

  it("makes the timelock the owner of the escrow", async function () {
    const { escrow, timelock } = await governanceFixture();
    expect(await escrow.owner()).to.equal(await timelock.getAddress());
  });

  it("blocks direct owner actions from the deployer after transfer", async function () {
    const { escrow, usdc, deployer, oracle, arb2, arb3 } = await governanceFixture();
    await expect(
      escrow.connect(deployer).setArbitrators([oracle.address, arb2.address, arb3.address])
    ).to.be.reverted;
    await expect(
      escrow.connect(deployer).pause()
    ).to.be.reverted;
    await expect(
      escrow.connect(deployer).setTokenAllowed(await usdc.getAddress(), false)
    ).to.be.reverted;
  });

  it("allows the owner action via a scheduled timelock call", async function () {
    const { escrow, timelock, deployer, oracle, arb2, arb3 } = await governanceFixture();
    const iface = new hre.ethers.Interface([
      "function setArbitrators(address[3] calldata newArbitrators)",
    ]);
    const data = iface.encodeFunctionData("setArbitrators", [
      [arb2.address, oracle.address, arb3.address],
    ]);
    const target = await escrow.getAddress();
    const value = 0n;
    const predecessor = hre.ethers.ZeroHash;
    const salt = hre.ethers.ZeroHash;

    await expect(
      timelock.connect(deployer).schedule(target, value, data, predecessor, salt, 2 * 24 * 60 * 60)
    ).to.emit(timelock, "CallScheduled");

    // Before the delay elapses execution must fail.
    await expect(
      timelock.connect(deployer).execute(target, value, data, predecessor, salt)
    ).to.be.reverted;

    // Advance past the delay and execute from the timelock as the escrow owner.
    await hre.network.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 1]);
    await hre.network.provider.send("evm_mine", []);
    await timelock.connect(deployer).execute(target, value, data, predecessor, salt);

    expect(await escrow.arbitrators(0)).to.equal(arb2.address);
    expect(await escrow.arbitrators(1)).to.equal(oracle.address);
    expect(await escrow.arbitrators(2)).to.equal(arb3.address);
  });
});
