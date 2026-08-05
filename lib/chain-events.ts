import { formatUnits } from "ethers";
import type { Prisma } from "@prisma/client";

/**
 * Pure settlement-matching logic for escrow chain events.
 * Isolated from the prisma singleton so it can be unit-tested with a mock client.
 */
export type DatabaseClient = Prisma.TransactionClient;

function toMicroUnits(value: string): bigint {
  const [whole = "0", frac = ""] = value.split(".");
  const micros = BigInt((frac + "000000").slice(0, 6).padEnd(6, "0"));
  return BigInt(whole) * BigInt(1_000_000) + micros;
}

async function updateMilestoneAfterExecution(
  db: DatabaseClient,
  milestoneId: string
) {
  const milestone = await db.tradeMilestone.findUnique({
    where: { id: milestoneId },
    include: { settlements: { where: { status: "EXECUTED" } } },
  });
  if (!milestone) return;
  const executed = milestone.settlements.reduce(
    (sum, settlement) => sum + toMicroUnits(settlement.amountUsdc.toString()),
    BigInt(0)
  );
  const target = toMicroUnits(milestone.amountUsdc.toString());
  await db.tradeMilestone.update({
    where: { id: milestoneId },
    data: {
      status: executed >= target ? "RELEASED" : "PARTIALLY_RELEASED",
    },
  });
}

export async function applyEscrowEvent(
  db: DatabaseClient,
  eventName: string,
  payload: Record<string, Prisma.InputJsonValue>,
  transactionHash: string
) {
  const blockchainTradeId = Number(payload.tradeId);
  if (!Number.isSafeInteger(blockchainTradeId) || blockchainTradeId <= 0) return;
  const trade = await db.tradeMetadata.findUnique({ where: { blockchainTradeId } });
  if (!trade) return;

  if (eventName === "TradeFunded") {
    await db.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "FUNDED" },
    });
  } else if (eventName === "TradePartialReleased") {
    await db.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "PARTIAL_SETTLEMENT" },
    });
  } else if (eventName === "TradeCompleted") {
    await db.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "RELEASED", operationalStatus: "CONDITIONS_SATISFIED" },
    });
  } else if (eventName === "TradeTimedOut" || eventName === "DisputeTimedOut") {
    await db.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "REFUNDED" },
    });
  } else if (eventName === "DisputeRaised") {
    await db.tradeMetadata.update({
      where: { id: trade.id },
      data: { settlementStatus: "DISPUTED", operationalStatus: "DISPUTED" },
    });
  } else if (eventName === "DisputeResolved") {
    await db.tradeMetadata.update({
      where: { id: trade.id },
      data: {
        settlementStatus: payload.refundBuyer === true ? "REFUNDED" : "RELEASED",
        operationalStatus: "CONDITIONS_SATISFIED",
      },
    });
  } else if (eventName === "ReleaseProposed") {
    const proposalId = Number(payload.proposalId);
    const milestoneHash = String(payload.milestoneHash).toLowerCase();
    const settlement = await db.milestoneSettlement.findUnique({
      where: { proposalId },
    });
    if (settlement) {
      await db.milestoneSettlement.update({
        where: { id: settlement.id },
        data: { status: "PROPOSED", milestoneHash },
      });
    } else {
      const byMilestone = await db.milestoneSettlement.findFirst({
        where: {
          milestone: { tradeId: trade.id },
          milestoneHash,
          status: { in: ["PENDING", "PROPOSED", "APPROVED"] },
        },
      });
      if (byMilestone) {
        await db.milestoneSettlement.update({
          where: { id: byMilestone.id },
          data: { status: "PROPOSED", proposalId, milestoneHash },
        });
      }
    }
  } else if (eventName === "ReleaseCancelled") {
    const proposalId = Number(payload.proposalId);
    await db.milestoneSettlement.updateMany({
      where: { proposalId, status: { in: ["PROPOSED", "APPROVED"] } },
      data: { status: "PENDING" },
    });
  } else if (eventName === "ReleaseApproved") {
    const proposalId = Number(payload.proposalId);
    const amount = String(payload.amount);
    const evidenceRoot = String(payload.evidenceRoot).toLowerCase();
    const milestoneHash = String(payload.milestoneHash).toLowerCase();
    const settlement = await db.milestoneSettlement.findUnique({
      where: { proposalId },
    });
    if (settlement) {
      await db.milestoneSettlement.update({
        where: { id: settlement.id },
        data: { status: "EXECUTED", transactionHash, evidenceRoot, milestoneHash },
      });
      await updateMilestoneAfterExecution(db, settlement.milestoneId);
    } else {
      const fallback = await db.milestoneSettlement.findFirst({
        where: {
          milestone: { tradeId: trade.id },
          amountUsdc: { equals: formatUnits(BigInt(amount), 6) },
          evidenceRoot,
          milestoneHash,
          status: { in: ["PROPOSED", "APPROVED"] },
        },
        orderBy: { createdAt: "asc" },
      });
      if (fallback) {
        await db.milestoneSettlement.update({
          where: { id: fallback.id },
          data: { status: "EXECUTED", transactionHash, proposalId },
        });
        await updateMilestoneAfterExecution(db, fallback.milestoneId);
      }
    }
  }
}
