import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("KontorEscrow V3", function () {
  async function deployFixture() {
    const [owner, seller, buyer, oracle, arb2, other, newArb1, newArb2, newArb3] =
      await hre.ethers.getSigners();

    const TestUSDC = await hre.ethers.getContractFactory("TestUSDC");
    const usdc = await TestUSDC.deploy();
    await usdc.waitForDeployment();

    const KontorEscrow = await hre.ethers.getContractFactory("KontorEscrow");
    const escrow = await KontorEscrow.deploy(
      owner.address,
      oracle.address,
      arb2.address,
      owner.address,
      25,
      await usdc.getAddress()
    );
    await escrow.waitForDeployment();

    const amount = hre.ethers.parseUnits("75000", 6);
    await usdc.mint(buyer.address, hre.ethers.parseUnits("1000000", 6));

    return {
      usdc,
      escrow,
      owner,
      seller,
      buyer,
      oracle,
      arb2,
      other,
      newArb1,
      newArb2,
      newArb3,
      amount,
    };
  }

  async function fundedTradeFixture() {
    const fixture = await loadFixture(deployFixture);
    const { escrow, usdc, seller, buyer, oracle, amount } = fixture;
    await escrow.connect(seller).createTrade(
      buyer.address,
      oracle.address,
      amount,
      await usdc.getAddress()
    );
    await usdc.connect(buyer).approve(await escrow.getAddress(), amount);
    await escrow.connect(buyer).fundTrade(1);
    return fixture;
  }

  describe("deployment and allowlist", function () {
    it("configures the default panel and initial allowed token", async function () {
      const { escrow, usdc, owner } = await loadFixture(deployFixture);
      expect(await escrow.arbitrators(0)).to.equal(owner.address);
      expect(await escrow.allowedTokens(await usdc.getAddress())).to.equal(true);
    });

    it("rejects a zero initial token", async function () {
      const { owner, oracle, arb2 } = await loadFixture(deployFixture);
      const factory = await hre.ethers.getContractFactory("KontorEscrow");
      await expect(
        factory.deploy(
          owner.address,
          oracle.address,
          arb2.address,
          owner.address,
          25,
          hre.ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid initial token");
    });

    it("only lets the TestUSDC owner mint", async function () {
      const { usdc, buyer } = await loadFixture(deployFixture);
      await expect(usdc.connect(buyer).mint(buyer.address, 1)).to.be.revertedWithCustomError(
        usdc,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("trade creation and funding deadlines", function () {
    it("snapshots arbitrators for the trade", async function () {
      const { escrow, usdc, seller, buyer, oracle, owner, arb2, amount } =
        await loadFixture(deployFixture);
      await escrow.connect(seller).createTrade(
        buyer.address,
        oracle.address,
        amount,
        await usdc.getAddress()
      );
      expect(await escrow.tradeArbitrators(1, 0)).to.equal(owner.address);
      expect(await escrow.tradeArbitrators(1, 2)).to.equal(arb2.address);
    });

    it("rejects tokens outside the allowlist", async function () {
      const { escrow, seller, buyer, oracle, other, amount } = await loadFixture(deployFixture);
      await expect(
        escrow.connect(seller).createTrade(buyer.address, oracle.address, amount, other.address)
      ).to.be.revertedWith("Token not allowed");
    });

    it("rejects funding after the deadline", async function () {
      const { escrow, usdc, seller, buyer, oracle, amount } = await loadFixture(deployFixture);
      await escrow.connect(seller).createTrade(
        buyer.address,
        oracle.address,
        amount,
        await usdc.getAddress()
      );
      await usdc.connect(buyer).approve(await escrow.getAddress(), amount);
      await time.increase(7 * 24 * 60 * 60 + 1);
      await expect(escrow.connect(buyer).fundTrade(1)).to.be.revertedWith(
        "Funding deadline passed"
      );
    });
  });

  describe("two-party milestone settlement", function () {
    const evidenceRoot = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ipfs://evidence-v1"));

    it("does not move funds when the oracle only proposes a release", async function () {
      const { escrow, usdc, seller, oracle, amount } = await fundedTradeFixture();
      await expect(escrow.connect(oracle).proposeRelease(1, amount, evidenceRoot))
        .to.emit(escrow, "ReleaseProposed")
        .withArgs(1n, amount, evidenceRoot);
      expect(await usdc.balanceOf(seller.address)).to.equal(0);
    });

    it("requires the designated oracle to propose", async function () {
      const { escrow, other, amount } = await fundedTradeFixture();
      await expect(
        escrow.connect(other).proposeRelease(1, amount, evidenceRoot)
      ).to.be.revertedWith("Not the designated oracle");
    });

    it("requires a non-zero evidence root", async function () {
      const { escrow, oracle, amount } = await fundedTradeFixture();
      await expect(
        escrow.connect(oracle).proposeRelease(1, amount, hre.ethers.ZeroHash)
      ).to.be.revertedWith("Evidence root required");
    });

    it("releases only after the buyer approves the exact proposal", async function () {
      const { escrow, usdc, seller, buyer, oracle, amount } = await fundedTradeFixture();
      await escrow.connect(oracle).proposeRelease(1, amount, evidenceRoot);

      await expect(escrow.connect(buyer).approveRelease(1, amount, evidenceRoot))
        .to.emit(escrow, "ReleaseApproved")
        .withArgs(1n, buyer.address, amount, evidenceRoot)
        .and.to.emit(escrow, "TradeCompleted")
        .withArgs(1n);

      const fee = (amount * 25n) / 10000n;
      expect(await usdc.balanceOf(seller.address)).to.equal(amount - fee);
    });

    it("supports separate buyer-approved partial releases", async function () {
      const { escrow, buyer, oracle, amount } = await fundedTradeFixture();
      const partial = amount / 3n;
      await escrow.connect(oracle).proposeRelease(1, partial, evidenceRoot);
      await escrow.connect(buyer).approveRelease(1, partial, evidenceRoot);
      const trade = await escrow.trades(1);
      expect(trade.releasedAmount).to.equal(partial);
      expect(trade.status).to.equal(1);
    });

    it("rejects approval after the oracle changes the pending proposal", async function () {
      const { escrow, buyer, oracle, amount } = await fundedTradeFixture();
      const originalAmount = amount / 2n;
      const changedRoot = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ipfs://changed"));
      await escrow.connect(oracle).proposeRelease(1, originalAmount, evidenceRoot);
      await escrow.connect(oracle).proposeRelease(1, amount, changedRoot);

      await expect(
        escrow.connect(buyer).approveRelease(1, originalAmount, evidenceRoot)
      ).to.be.revertedWith("Release amount changed");
    });
  });

  describe("timeouts, pause, and recovery", function () {
    it("lets the buyer recover remaining funds after the release deadline", async function () {
      const { escrow, usdc, buyer, amount } = await fundedTradeFixture();
      const balanceBefore = await usdc.balanceOf(buyer.address);
      await time.increase(30 * 24 * 60 * 60 + 1);
      await expect(escrow.connect(buyer).claimTimeoutRefund(1))
        .to.emit(escrow, "TradeTimedOut")
        .withArgs(1n, amount);
      expect(await usdc.balanceOf(buyer.address)).to.equal(balanceBefore + amount);
    });

    it("pauses new settlement activity but keeps timeout recovery available", async function () {
      const { escrow, buyer } = await fundedTradeFixture();
      await escrow.pause();
      await time.increase(30 * 24 * 60 * 60 + 1);
      await expect(escrow.connect(buyer).claimTimeoutRefund(1)).to.not.be.reverted;
    });

    it("lets the buyer recover funds when arbitrators miss the dispute deadline", async function () {
      const { escrow, usdc, buyer, amount } = await fundedTradeFixture();
      const balanceBefore = await usdc.balanceOf(buyer.address);
      await escrow.connect(buyer).raiseDispute(1);
      await time.increase(30 * 24 * 60 * 60 + 1);

      await expect(escrow.connect(buyer).claimDisputeTimeoutRefund(1))
        .to.emit(escrow, "DisputeTimedOut")
        .withArgs(1n, amount);
      expect(await usdc.balanceOf(buyer.address)).to.equal(balanceBefore + amount);
    });
  });

  describe("trade-specific arbitration", function () {
    it("keeps the original panel after defaults change", async function () {
      const {
        escrow,
        buyer,
        oracle,
        owner,
        newArb1,
        newArb2,
        newArb3,
      } = await fundedTradeFixture();

      await escrow.setArbitrators([newArb1.address, newArb2.address, newArb3.address]);
      expect(await escrow.tradeArbitrators(1, 0)).to.equal(owner.address);

      await escrow.connect(buyer).raiseDispute(1);
      await escrow.connect(owner).voteDispute(1, true);
      await expect(escrow.connect(oracle).voteDispute(1, true))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1n, true);
    });

    it("rejects a new default arbitrator from voting on an old trade", async function () {
      const { escrow, buyer, newArb1, newArb2, newArb3 } = await fundedTradeFixture();
      await escrow.setArbitrators([newArb1.address, newArb2.address, newArb3.address]);
      await escrow.connect(buyer).raiseDispute(1);
      await expect(escrow.connect(newArb1).voteDispute(1, true)).to.be.revertedWith(
        "Not a trade arbitrator"
      );
    });
  });
});
