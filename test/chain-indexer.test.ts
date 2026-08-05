import { expect } from "chai";
import { formatUnits } from "ethers";
import type { Prisma } from "@prisma/client";
import { applyEscrowEvent } from "../lib/chain-events.ts";

type EscrowDb = Parameters<typeof applyEscrowEvent>[0];

type Settlement = {
  id: string;
  milestoneId: string;
  amountUsdc: string;
  status: string;
  evidenceRoot: string | null;
  proposalId: number | null;
  milestoneHash: string | null;
  transactionHash: string | null;
};

type Milestone = {
  id: string;
  amountUsdc: string;
  status: string;
  settlements: Settlement[];
};

type Trade = {
  id: string;
  blockchainTradeId: number;
  settlementStatus: string;
  operationalStatus: string;
  milestones: Milestone[];
};

const TRADE_ID = "trade-1";
const MILESTONE_ID = "milestone-1";
const HASH_A = "0xaaaa";
const HASH_B = "0xbbbb";
const AMOUNT_WEI = 1_000_000n;
const AMOUNT_USDC = formatUnits(AMOUNT_WEI, 6);

type JsonRecord = Record<string, unknown>;

type UpdateInput = { where: { id: string }; data: JsonRecord };
type WhereUnique = { proposalId?: number };
type FindFirstInput = { where: JsonRecord };
type UpdateManyInput = { where: JsonRecord; data: JsonRecord };

function makeDb(initial: { trades: Trade[] }) {
  const state = {
    trades: JSON.parse(JSON.stringify(initial.trades)),
    chainEvents: [] as { eventName: string; transactionHash: string }[],
  };

  return {
    state,
    tradeMetadata: {
      findUnique: async ({ where }: { where: { blockchainTradeId: number } }) =>
        state.trades.find((t) => t.blockchainTradeId === where.blockchainTradeId) ?? null,
      update: async ({ where, data }: UpdateInput) => {
        const trade = state.trades.find((t) => t.id === where.id)!;
        Object.assign(trade, data);
        return trade;
      },
    },
    milestoneSettlement: {
      findUnique: async ({ where }: { where: WhereUnique }) => {
        for (const trade of state.trades) {
          for (const milestone of trade.milestones) {
            const found = milestone.settlements.find(
              (s) => where.proposalId != null && s.proposalId === where.proposalId
            );
            if (found) return found;
          }
        }
        return null;
      },
      findFirst: async ({ where }: FindFirstInput) => {
        for (const trade of state.trades) {
          for (const milestone of trade.milestones) {
            const milestoneFilter = where.milestone as
              | { tradeId?: string }
              | undefined;
            if (milestoneFilter?.tradeId && trade.id !== milestoneFilter.tradeId) continue;
            const candidates = milestone.settlements.filter((s) => {
              const amountFilter = where.amountUsdc as
                | { equals?: string }
                | undefined;
              if (amountFilter?.equals !== undefined && s.amountUsdc !== amountFilter.equals) {
                return false;
              }
              if (where.evidenceRoot && s.evidenceRoot !== where.evidenceRoot) return false;
              if (where.milestoneHash && s.milestoneHash !== where.milestoneHash) return false;
              const statusFilter = where.status as { in?: string[] } | undefined;
              if (statusFilter?.in && !statusFilter.in.includes(s.status)) return false;
              return true;
            });
            if (candidates.length > 0) {
              return [...candidates].sort((a, b) => a.id.localeCompare(b.id))[0];
            }
          }
        }
        return null;
      },
      update: async ({ where, data }: UpdateInput) => {
        for (const trade of state.trades) {
          for (const milestone of trade.milestones) {
            const s = milestone.settlements.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
          }
        }
        return null;
      },
      updateMany: async ({ where, data }: UpdateManyInput) => {
        let count = 0;
        for (const trade of state.trades) {
          for (const milestone of trade.milestones) {
            for (const s of milestone.settlements) {
              if (where.proposalId != null && s.proposalId === where.proposalId) {
                const statusFilter = where.status as { in?: string[] } | undefined;
                if (statusFilter?.in && !statusFilter.in.includes(s.status)) continue;
                Object.assign(s, data);
                count++;
              }
            }
          }
        }
        return { count };
      },
    },
    tradeMilestone: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        for (const trade of state.trades) {
          for (const milestone of trade.milestones) {
            if (milestone.id === where.id) {
              return {
                ...milestone,
                settlements: milestone.settlements.filter((s) => s.status === "EXECUTED"),
              };
            }
          }
        }
        return null;
      },
      update: async ({ where, data }: UpdateInput) => {
        for (const trade of state.trades) {
          for (const milestone of trade.milestones) {
            if (milestone.id === where.id) Object.assign(milestone, data);
          }
        }
        return null;
      },
    },
  };
}

describe("chain indexer settlement matching (V4 proposals)", function () {
  it("binds ReleaseProposed to the pending settlement by proposalId and milestoneHash", async function () {
    const db = makeDb({
      trades: [
        {
          id: TRADE_ID,
          blockchainTradeId: 1,
          settlementStatus: "FUNDED",
          operationalStatus: "PENDING",
          milestones: [
            {
              id: MILESTONE_ID,
              amountUsdc: AMOUNT_USDC,
              status: "EVIDENCE_PENDING",
              settlements: [
                {
                  id: "settlement-1",
                  milestoneId: MILESTONE_ID,
                  amountUsdc: AMOUNT_USDC,
                  status: "PENDING",
                  evidenceRoot: HASH_A,
                  proposalId: 7,
                  milestoneHash: null,
                  transactionHash: null,
                },
              ],
            },
          ],
        },
      ],
    });

    await applyEscrowEvent(db as unknown as EscrowDb, "ReleaseProposed", {
      tradeId: 1,
      proposalId: 7,
      milestoneHash: HASH_A,
      amount: AMOUNT_WEI,
      evidenceRoot: HASH_A,
    } as Record<string, Prisma.InputJsonValue>, "0xtx1");

    const settlement = db.state.trades[0].milestones[0].settlements[0];
    expect(settlement.status).to.equal("PROPOSED");
    expect(settlement.proposalId).to.equal(7);
    expect(settlement.milestoneHash).to.equal(HASH_A);
  });

  it("executes the exact settlement for ReleaseApproved via proposalId, not amount matching", async function () {
    const db = makeDb({
      trades: [
        {
          id: TRADE_ID,
          blockchainTradeId: 1,
          settlementStatus: "FUNDED",
          operationalStatus: "PENDING",
          milestones: [
            {
              id: MILESTONE_ID,
              amountUsdc: AMOUNT_USDC,
              status: "EVIDENCE_PENDING",
              settlements: [
                {
                  id: "settlement-1",
                  milestoneId: MILESTONE_ID,
                  amountUsdc: AMOUNT_USDC,
                  status: "PROPOSED",
                  evidenceRoot: HASH_A,
                  proposalId: 7,
                  milestoneHash: HASH_A,
                  transactionHash: null,
                },
                {
                  id: "settlement-2",
                  milestoneId: MILESTONE_ID,
                  amountUsdc: AMOUNT_USDC,
                  status: "PROPOSED",
                  evidenceRoot: HASH_B,
                  proposalId: 8,
                  milestoneHash: HASH_B,
                  transactionHash: null,
                },
              ],
            },
          ],
        },
      ],
    });

    await applyEscrowEvent(db as unknown as EscrowDb, "ReleaseApproved", {
      tradeId: 1,
      proposalId: 8,
      buyer: "0xb",
      milestoneHash: HASH_B,
      amount: AMOUNT_WEI,
      evidenceRoot: HASH_B,
    } as Record<string, Prisma.InputJsonValue>, "0xtx2");

    const settlements = db.state.trades[0].milestones[0].settlements;
    expect(settlements[0].status).to.equal("PROPOSED");
    expect(settlements[1].status).to.equal("EXECUTED");
    expect(settlements[1].transactionHash).to.equal("0xtx2");
  });

  it("marks a proposal settlement back to PENDING on ReleaseCancelled", async function () {
    const db = makeDb({
      trades: [
        {
          id: TRADE_ID,
          blockchainTradeId: 1,
          settlementStatus: "FUNDED",
          operationalStatus: "PENDING",
          milestones: [
            {
              id: MILESTONE_ID,
              amountUsdc: AMOUNT_USDC,
              status: "READY_FOR_RELEASE",
              settlements: [
                {
                  id: "settlement-1",
                  milestoneId: MILESTONE_ID,
                  amountUsdc: AMOUNT_USDC,
                  status: "PROPOSED",
                  evidenceRoot: HASH_A,
                  proposalId: 7,
                  milestoneHash: HASH_A,
                  transactionHash: null,
                },
              ],
            },
          ],
        },
      ],
    });

    await applyEscrowEvent(db as unknown as EscrowDb, "ReleaseCancelled", {
      tradeId: 1,
      proposalId: 7,
      milestoneHash: HASH_A,
    } as Record<string, Prisma.InputJsonValue>, "0xtx3");

    expect(db.state.trades[0].milestones[0].settlements[0].status).to.equal("PENDING");
  });
});
