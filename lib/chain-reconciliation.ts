import { Contract, type Provider } from "ethers";
import prisma from "./prisma";
import { operationalLog } from "./logger";

const TRADE_ABI = [
  "function trades(uint256) view returns (address buyer,address seller,address oracle,uint256 totalAmount,uint256 releasedAmount,address token,uint8 status,uint8 votesForBuyer,uint8 votesForSeller)",
  "function pendingProposalOf(uint256) view returns (uint256)",
  "function proposals(uint256) view returns (uint256 proposalId,uint256 tradeId,bytes32 milestoneHash,uint256 amount,bytes32 evidenceRoot,address proposedBy,uint64 createdAt,uint8 status)",
] as const;

const SETTLEMENT_STATUS = [
  "AWAITING_FUNDS",
  "FUNDED",
  "RELEASED",
  "DISPUTED",
  "REFUNDED",
] as const;

const PROPOSAL_STATUS = ["PENDING", "APPROVED", "CANCELLED"] as const;

type ReconciliationOptions = {
  provider: Provider;
  network: string;
  contractAddress: string;
  limit?: number;
};

async function recordIssue(options: ReconciliationOptions, data: {
  tradeId: string;
  blockchainTradeId: number;
  field: string;
  databaseValue?: string;
  chainValue: string;
  details?: Record<string, string>;
}) {
  return prisma.reconciliationIssue.create({
    data: {
      network: options.network,
      contractAddress: options.contractAddress.toLowerCase(),
      tradeId: data.tradeId,
      blockchainTradeId: data.blockchainTradeId,
      field: data.field,
      databaseValue: data.databaseValue ?? null,
      chainValue: data.chainValue,
      details: data.details ?? undefined,
    },
  });
}

export async function reconcileEscrowState(options: ReconciliationOptions) {
  const contract = new Contract(options.contractAddress, TRADE_ABI, options.provider);
  const trades = await prisma.tradeMetadata.findMany({
    where: { blockchainTradeId: { not: null } },
    include: {
      milestones: { include: { settlements: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: options.limit ?? 100,
  });
  let corrected = 0;

  for (const trade of trades) {
    const blockchainTradeId = trade.blockchainTradeId!;
    try {
      const [chainTrade, pendingProposalId] = await Promise.all([
        contract.trades(blockchainTradeId),
        contract.pendingProposalOf(blockchainTradeId),
      ]);
      const chainStatus = SETTLEMENT_STATUS[Number(chainTrade.status)];
      const chainReleased = chainTrade.releasedAmount.toString();
      const chainTotal = chainTrade.totalAmount.toString();

      if (chainStatus && chainStatus !== trade.settlementStatus) {
        const issue = await recordIssue(options, {
          tradeId: trade.id,
          blockchainTradeId,
          field: "settlementStatus",
          databaseValue: trade.settlementStatus,
          chainValue: chainStatus,
          details: { releasedAmount: chainReleased, totalAmount: chainTotal },
        });
        await prisma.$transaction([
          prisma.tradeMetadata.update({
            where: { id: trade.id },
            data: {
              settlementStatus: chainStatus,
              operationalStatus:
                chainStatus === "DISPUTED"
                  ? "DISPUTED"
                  : chainStatus === "RELEASED"
                    ? "CONDITIONS_SATISFIED"
                    : trade.operationalStatus,
            },
          }),
          prisma.reconciliationIssue.update({
            where: { id: issue.id },
            data: { status: "RESOLVED", resolvedAt: new Date() },
          }),
        ]);
        corrected++;
      }

      const pendingProposal =
        Number(pendingProposalId) > 0
          ? await contract.proposals(Number(pendingProposalId))
          : null;

      const dbPending = trade.milestones
        .flatMap((milestone) => milestone.settlements)
        .find((settlement) => settlement.status === "PROPOSED" || settlement.status === "APPROVED");

      if (pendingProposal && Number(pendingProposal[0]) > 0) {
        const chainMilestoneHash = String(pendingProposal[2]).toLowerCase();
        const chainAmount = String(pendingProposal[3]);
        const chainRoot = String(pendingProposal[4]).toLowerCase();
        if (!dbPending) {
          await recordIssue(options, {
            tradeId: trade.id,
            blockchainTradeId,
            field: "pendingProposal",
            databaseValue: "none",
            chainValue: `proposal ${Number(pendingProposal[0])}`,
            details: {
              milestoneHash: chainMilestoneHash,
              amount: chainAmount,
              evidenceRoot: chainRoot,
            },
          });
        } else {
          const matches =
            (dbPending.milestoneHash ?? "").toLowerCase() === chainMilestoneHash &&
            dbPending.amountUsdc.toString() === String(Number(chainAmount) / 1e6) &&
            (dbPending.evidenceRoot ?? "").toLowerCase() === chainRoot;
          if (!matches) {
            await recordIssue(options, {
              tradeId: trade.id,
              blockchainTradeId,
              field: "pendingProposal",
              databaseValue: dbPending.evidenceRoot ?? "unknown",
              chainValue: chainRoot,
              details: {
                settlementId: dbPending.id,
                milestoneHash: chainMilestoneHash,
                amount: chainAmount,
                proposalStatus: PROPOSAL_STATUS[Number(pendingProposal[7])] ?? "UNKNOWN",
              },
            });
          }
        }
      } else if (dbPending) {
        await recordIssue(options, {
          tradeId: trade.id,
          blockchainTradeId,
          field: "pendingProposal",
          databaseValue: dbPending.evidenceRoot ?? "unknown",
          chainValue: "none",
          details: { settlementId: dbPending.id },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      operationalLog("error", "trade_reconciliation_failed", {
        blockchainTradeId,
        error: message,
      });
    }
  }

  operationalLog("info", "chain_reconciliation_complete", {
    network: options.network,
    contractAddress: options.contractAddress.toLowerCase(),
    scanned: trades.length,
    corrected,
  });
  return { scanned: trades.length, corrected };
}
