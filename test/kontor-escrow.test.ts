import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("KontorEscrow", function () {
  async function deployFixture() {
    const [owner, seller, buyer, oracle, other] = await hre.ethers.getSigners();

    const TestUSDC = await hre.ethers.getContractFactory("TestUSDC");
    const usdc = await TestUSDC.deploy();
    await usdc.waitForDeployment();

    const KontorEscrow = await hre.ethers.getContractFactory("KontorEscrow");
    const escrow = await KontorEscrow.deploy(owner.address, owner.address, 25);
    await escrow.waitForDeployment();

    await usdc.mint(buyer.address, hre.ethers.parseUnits("1000000", 6));

    return { usdc, escrow, owner, seller, buyer, oracle, other };
  }

  describe("Deployment", function () {
    it("should set the arbitrator to the deployer", async function () {
      const { escrow, owner } = await loadFixture(deployFixture);
      expect(await escrow.arbitrator()).to.equal(owner.address);
    });

    it("should start with nextTradeId = 1", async function () {
      const { escrow } = await loadFixture(deployFixture);
      expect(await escrow.nextTradeId()).to.equal(1n);
    });
  });

  describe("createTrade", function () {
    it("should create a trade and emit event", async function () {
      const { escrow, seller, buyer, oracle } = await loadFixture(deployFixture);
      const amount = hre.ethers.parseUnits("75000", 6);

      await expect(
        escrow.connect(seller).createTrade(buyer.address, oracle.address, amount, buyer.address, "Test trade")
      )
        .to.emit(escrow, "TradeCreated")
        .withArgs(1n, buyer.address, seller.address, amount);
    });

    it("should revert with zero amount", async function () {
      const { escrow, seller, buyer, oracle } = await loadFixture(deployFixture);
      await expect(
        escrow.connect(seller).createTrade(buyer.address, oracle.address, 0, buyer.address, "Zero amount")
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("fundTrade", function () {
    it("should fund a trade and transfer tokens", async function () {
      const { escrow, usdc, seller, buyer, oracle } = await loadFixture(deployFixture);
      const amount = hre.ethers.parseUnits("75000", 6);

      await escrow.connect(seller).createTrade(buyer.address, oracle.address, amount, await usdc.getAddress(), "Test");
      await usdc.connect(buyer).approve(await escrow.getAddress(), amount);

      await expect(escrow.connect(buyer).fundTrade(1))
        .to.emit(escrow, "TradeFunded")
        .withArgs(1n);

      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(amount);
    });

    it("should revert if not the buyer", async function () {
      const { escrow, seller, buyer, oracle, other } = await loadFixture(deployFixture);
      const amount = hre.ethers.parseUnits("75000", 6);

      await escrow.connect(seller).createTrade(buyer.address, oracle.address, amount, buyer.address, "Test");
      await expect(escrow.connect(other).fundTrade(1)).to.be.revertedWith("Not the buyer");
    });
  });

  describe("approveTradeByOracle", function () {
    it("should release funds to seller when oracle approves", async function () {
      const { escrow, usdc, seller, buyer, oracle } = await loadFixture(deployFixture);
      const amount = hre.ethers.parseUnits("75000", 6);

      await escrow.connect(seller).createTrade(buyer.address, oracle.address, amount, await usdc.getAddress(), "Test");
      await usdc.connect(buyer).approve(await escrow.getAddress(), amount);
      await escrow.connect(buyer).fundTrade(1);
      const sellerBalBefore = await usdc.balanceOf(seller.address);

      await expect(escrow.connect(oracle).approveTradeByOracle(1))
        .to.emit(escrow, "TradeApproved")
        .withArgs(1n);

      expect(await usdc.balanceOf(seller.address)).to.equal(sellerBalBefore + amount);
    });

    it("should revert if called by non-oracle", async function () {
      const { escrow, usdc, seller, buyer, oracle, other } = await loadFixture(deployFixture);
      const amount = hre.ethers.parseUnits("75000", 6);

      await escrow.connect(seller).createTrade(buyer.address, oracle.address, amount, await usdc.getAddress(), "Test");
      await usdc.connect(buyer).approve(await escrow.getAddress(), amount);
      await escrow.connect(buyer).fundTrade(1);

      await expect(escrow.connect(other).approveTradeByOracle(1)).to.be.revertedWith("Not the designated oracle");
    });
  });

  describe("Dispute lifecycle", function () {
    it("should allow buyer to raise and arbitrator to resolve (refund)", async function () {
      const { escrow, usdc, seller, buyer, oracle, owner } = await loadFixture(deployFixture);
      const amount = hre.ethers.parseUnits("75000", 6);

      await escrow.connect(seller).createTrade(buyer.address, oracle.address, amount, await usdc.getAddress(), "Test");
      await usdc.connect(buyer).approve(await escrow.getAddress(), amount);
      await escrow.connect(buyer).fundTrade(1);

      await expect(escrow.connect(buyer).raiseDispute(1))
        .to.emit(escrow, "DisputeRaised")
        .withArgs(1n, buyer.address);

      const buyerBalBefore = await usdc.balanceOf(buyer.address);

      await expect(escrow.connect(owner).resolveDispute(1, true))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1n, true);

      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBalBefore + amount);
    });

    it("should allow seller to raise and arbitrator to resolve (release)", async function () {
      const { escrow, usdc, seller, buyer, oracle, owner } = await loadFixture(deployFixture);
      const amount = hre.ethers.parseUnits("75000", 6);

      await escrow.connect(seller).createTrade(buyer.address, oracle.address, amount, await usdc.getAddress(), "Test");
      await usdc.connect(buyer).approve(await escrow.getAddress(), amount);
      await escrow.connect(buyer).fundTrade(1);
      await escrow.connect(seller).raiseDispute(1);

      const sellerBalBefore = await usdc.balanceOf(seller.address);

      await escrow.connect(owner).resolveDispute(1, false);

      expect(await usdc.balanceOf(seller.address)).to.equal(sellerBalBefore + amount);
    });

    it("should revert dispute on non-funded trade", async function () {
      const { escrow, seller, buyer, oracle } = await loadFixture(deployFixture);
      const amount = hre.ethers.parseUnits("75000", 6);

      await escrow.connect(seller).createTrade(buyer.address, oracle.address, amount, buyer.address, "Test");
      await expect(escrow.connect(buyer).raiseDispute(1)).to.be.revertedWith("Can only dispute funded trades");
    });
  });

  describe("setArbitrator", function () {
    it("should allow owner to change arbitrator", async function () {
      const { escrow, owner, other } = await loadFixture(deployFixture);
      await escrow.connect(owner).setArbitrator(other.address);
      expect(await escrow.arbitrator()).to.equal(other.address);
    });

    it("should revert if non-owner tries", async function () {
      const { escrow, seller } = await loadFixture(deployFixture);
      await expect(escrow.connect(seller).setArbitrator(seller.address)).to.be.revertedWithCustomError(
        escrow,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});
