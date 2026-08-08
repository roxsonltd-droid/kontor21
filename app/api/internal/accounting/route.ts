import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthorizedInternalRequest } from "@/lib/internal-auth";
import { ledgerSummary } from "@/lib/token-ledger";

// Historical token-accounting overview: ledger rows derived from escrow chain
// events, grouped into deposit/release/fee/refund totals per trade.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedInternalRequest(req)) {
    return NextResponse.json({ error: "Internal authorization required" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const tradeId = searchParams.get("tradeId") || undefined;

  const where = tradeId ? { tradeId } : {};
  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { blockNumber: "desc" },
    take: 1000,
  });

  const rows = entries.map((entry) => ({
    id: entry.id,
    category: entry.category,
    blockchainTradeId: entry.blockchainTradeId,
    amountUsdc: entry.amountUsdc.toString(),
    amountMicros: entry.amountMicros.toString(),
    feeMicros: entry.feeMicros.toString(),
    feeBasisPoints: entry.feeBasisPoints,
    from: entry.from,
    to: entry.to,
    transactionHash: entry.transactionHash,
    blockNumber: entry.blockNumber.toString(),
  }));

  const summary = ledgerSummary(
    entries.map((e) => ({ category: e.category, amountMicros: e.amountMicros }))
  );
  const totals = Object.fromEntries(
    Object.entries(summary.totals).map(([category, micros]) => [
      category,
      { micros: micros.toString(), usdc: summary.microToUsdc(micros) },
    ])
  );

  return NextResponse.json({
    tradeId: tradeId || null,
    count: rows.length,
    entries: rows,
    summary: { totals, unit: "USDC" },
  });
}