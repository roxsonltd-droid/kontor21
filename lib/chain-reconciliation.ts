import { Contract, type Provider } from "ethers";
import prisma from "./prisma";
import { operationalLog } from "./logger";

const TRADE_ABI = [
  "function trades(uint256) view returns (address buyer,address seller,address oracle,uint256 totalAmount,uint256 releasedAmount,address token,uint8 status,uint8 votesForBuyer,uint8 votesForSeller)",
] as const;

const SETTLEMENT_STATUS = [
  "AWAITING_FUNDS",
  "FUNDED",
  "RELEASED",
  "DISPUTED",
  "REFUNDED",
] as const;

type ReconciliationOptions = {
  provider: Provider;
  network: string;
  contractAddress: string;
  limit?: number;
};

export async function reconcileEscrowState(options: ReconciliationOptions) {
  const contract = new Contract(options.contractAddress, TRADE_ABI, options.provider);
  const trades = await prisma.tradeMetadata.findMany({
    where: { blockchainTradeId: { not: null } },
    orderBy: { updatedAt: "asc" },
    take: options.limit ?? 100,
  });
  let corrected = 0;

  for (const trade of trades) {
    const blockchainTradeId = trade.blockchainTradeId!;
    try {
      const chainTrade = await contract.trades(blockchainTradeId);
      const chainStatus = SETTLEMENT_STATUS[Number(chainTrade.status)];
      if (!chainStatus || chainStatus === trade.settlementStatus) continue;

      const issue = await prisma.reconciliationIssue.create({
        data: {
          network: options.network,
          contractAddress: options.contractAddress.toLowerCase(),
          tradeId: trade.id,
          blockchainTradeId,
          field: "settlementStatus",
          databaseValue: trade.settlementStatus,
          chainValue: chainStatus,
          details: {
            releasedAmount: chainTrade.releasedAmount.toString(),
            totalAmount: chainTrade.totalAmount.toString(),
          },
        },
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
    scanned: trades.length,
    corrected,
  });
  return { scanned: trades.length, corrected };
}
