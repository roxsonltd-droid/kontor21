import { expect } from "chai";
import {
  ledgerEntriesForEvent,
  applyEscrowLedgerEntries,
  ledgerSummary,
  toMicroUnits,
} from "../lib/token-ledger.ts";
import type { Prisma } from "@prisma/client";

const CTX = { network: "polygon-amoy", feeBasisPoints: 25 };

function payload(overrides: Record<string, unknown>): Record<string, Prisma.InputJsonValue> {
  return overrides as Record<string, Prisma.InputJsonValue>;
}

describe("token ledger", function () {
  describe("ledgerEntriesForEvent", function () {
    it("records a DEPOSIT on TradeCreated", function () {
      const entries = ledgerEntriesForEvent(
        "TradeCreated",
        payload({ tradeId: 3, amount: 1_000_000n }),
        CTX
      );
      expect(entries).to.have.length(1);
      expect(entries[0].category).to.equal("DEPOSIT");
      expect(entries[0].amountMicros).to.equal(1_000_000n);
      expect(entries[0].blockchainTradeId).to.equal(3);
    });

    it("splits ReleaseApproved into a net RELEASE and a FEE", function () {
      const entries = ledgerEntriesForEvent(
        "ReleaseApproved",
        payload({ tradeId: 5, amount: 1_000_000n }),
        CTX
      );
      expect(entries).to.have.length(2);
      const release = entries.find((e) => e.category === "RELEASE")!;
      const fee = entries.find((e) => e.category === "FEE")!;
      expect(release.amountMicros).to.equal(1_000_000n - 2_500n);
      expect(fee.amountMicros).to.equal(2_500n); // 0.25%
      expect(fee.feeBasisPoints).to.equal(25);
    });

    it("refunds on TradeTimedOut", function () {
      const entries = ledgerEntriesForEvent(
        "TradeTimedOut",
        payload({ tradeId: 9, refundedAmount: 750_000n }),
        CTX
      );
      expect(entries).to.have.length(1);
      expect(entries[0].category).to.equal("REFUND");
      expect(entries[0].amountMicros).to.equal(750_000n);
    });

    it("returns nothing for non-fund-moving events", function () {
      expect(
        ledgerEntriesForEvent("ReleaseProposed", payload({ tradeId: 1, proposalId: 2n }), CTX)
      ).to.deep.equal([]);
    });
  });

  describe("applyEscrowLedgerEntries", function () {
    type Trade = {
      id: string;
      blockchainTradeId: number;
      buyer?: { walletAddress: string };
      seller?: { walletAddress: string };
    };

    function makeDb(trades: Trade[]) {
      const entries: unknown[] = [];
      const db = {
        tradeMetadata: {
          findUnique: async ({ where }: { where: { blockchainTradeId: number } }) =>
            trades.find((t) => t.blockchainTradeId === where.blockchainTradeId) ?? null,
        },
        ledgerEntry: {
          create: async ({ data }: { data: unknown }) => {
            entries.push(data);
            return data;
          },
        },
      };
      return { db, entries };
    }

    const meta = {
      transactionHash: "0xtx",
      chainEventId: "ev1",
      blockNumber: 1234n,
    };

    it("writes a deposit row bound to the buyer wallet", async function () {
      const { db, entries } = makeDb([
        {
          id: "trade-dep",
          blockchainTradeId: 3,
          buyer: { walletAddress: "0xBuyer" },
          seller: { walletAddress: "0xSeller" },
        },
      ]);
      await applyEscrowLedgerEntries(
        db as never,
        CTX,
        "TradeCreated",
        payload({ tradeId: 3, amount: 1_000_000n }),
        meta
      );
      expect(entries).to.have.length(1);
      const row = entries[0] as Record<string, unknown>;
      expect(row.category).to.equal("DEPOSIT");
      expect(row.tradeId).to.equal("trade-dep");
      expect(row.from).to.equal("0xBuyer");
      expect(row.to).to.equal(null);
      expect(row.amountUsdc).to.equal("1.0");
    });

    it("writes two rows for a release and binds the seller wallet", async function () {
      const { db, entries } = makeDb([
        {
          id: "trade-1",
          blockchainTradeId: 5,
          buyer: { walletAddress: "0xBuyer" },
          seller: { walletAddress: "0xSeller" },
        },
      ]);
      await applyEscrowLedgerEntries(
        db as never,
        CTX,
        "ReleaseApproved",
        payload({ tradeId: 5, amount: 1_000_000n }),
        meta
      );
      expect(entries).to.have.length(2);
      const release = entries.find(
        (e) => (e as { category: string }).category === "RELEASE"
      ) as Record<string, unknown>;
      expect(release.tradeId).to.equal("trade-1");
      expect(release.to).to.equal("0xSeller");
      expect(release.amountUsdc).to.equal("0.9975");
      const fee = entries.find(
        (e) => (e as { category: string }).category === "FEE"
      ) as Record<string, unknown>;
      expect(fee.amountMicros).to.equal(2500n);
    });

    it("still records entries when the trade row is missing", async function () {
      const { db, entries } = makeDb([]);
      await applyEscrowLedgerEntries(
        db as never,
        CTX,
        "TradeCreated",
        payload({ tradeId: 99, amount: 5n }),
        meta
      );
      expect(entries).to.have.length(1);
      expect((entries[0] as Record<string, unknown>).tradeId).to.equal(null);
    });
  });

  describe("ledgerSummary", function () {
    it("totals micro amounts per category", async function () {
      const summary = ledgerSummary([
        { category: "DEPOSIT", amountMicros: toMicroUnits("1000") },
        { category: "RELEASE", amountMicros: toMicroUnits("900") },
        { category: "FEE", amountMicros: toMicroUnits("2") },
      ]);
      expect(summary.totals.DEPOSIT).to.equal(1_000_000_000n);
      expect(summary.totals.RELEASE).to.equal(900_000_000n);
      expect(summary.totals.FEE).to.equal(2_000_000n);
      expect(summary.microToUsdc(1_000_000n)).to.equal("1.0");
    });
  });
});