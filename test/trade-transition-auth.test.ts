import { expect } from "chai";
import { isAuthorizedTradeTransition } from "../lib/trade-transition-auth.ts";

const base = {
  currentBlockchainTradeId: null,
  currentOperationalStatus: "PENDING",
  currentSettlementStatus: "AWAITING_FUNDS",
  isBuyer: false,
  isSeller: false,
  isOracle: false,
  isArbitrator: false,
};

describe("trade transition authorization", function () {
  it("rejects a seller smuggling a settlement change with a blockchain link", function () {
    expect(
      isAuthorizedTradeTransition(
        { blockchainTradeId: 1, settlementStatus: "RELEASED" },
        { ...base, isSeller: true }
      )
    ).to.equal(false);
  });

  it("allows a seller to link a previously unlinked trade only", function () {
    expect(
      isAuthorizedTradeTransition(
        { blockchainTradeId: 1 },
        { ...base, isSeller: true }
      )
    ).to.equal(true);
  });

  it("requires dispute fields to move together from a funded state", function () {
    const funded = {
      ...base,
      currentSettlementStatus: "FUNDED",
      isBuyer: true,
    };
    expect(
      isAuthorizedTradeTransition(
        { operationalStatus: "DISPUTED", settlementStatus: "DISPUTED" },
        funded
      )
    ).to.equal(true);
    expect(
      isAuthorizedTradeTransition({ operationalStatus: "DISPUTED" }, funded)
    ).to.equal(false);
  });
});
