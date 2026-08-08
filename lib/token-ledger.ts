import { formatUnits } from "ethers";
import type { Prisma } from "@prisma/client";

/**
 * Pure token-accounting ledgers derived from escrow chain events.
 * Isolated from the prisma singleton so it can be unit-tested with a mock client.
 *
 * Each escrow event maps to a set of token movements:
 *  - TradeCreated        -> the buyer commits a DEPOSIT of the full amount.
 *  - ReleaseApproved     -> a RELEASE to the seller minus the fee, plus a FEE to
 *    the fee treasury (amount * feeBasisPoints / 10000).
 *  - TradeTimedOut / DisputeTimedOut / DisputeResolved{refundBuyer:true}
 *    -> a REFUND back to the buyer.
 *
 * Retention uses micro-unit integers (6 decimals) to avoid float drift; a
 * decimal string equivalent is stored for display. Buyer/seller wallets are
 * resolved from the in-app trade by the DB application layer.
 */

export type DatabaseClient = Prisma.TransactionClient;

export type LedgerCategoryValue = "DEPOSIT" | "RELEASE" | "FEE" | "REFUND";

export type LedgerContext = {
  network: string;
  feeBasisPoints: number; // e.g. 25 for 0.25%
};

function toMicroUnits(value: string): bigint {
  const [whole = "0", frac = ""] = value.split(".");
  const micros = BigInt((frac + "000000").slice(0, 6).padEnd(6, "0"));
  return BigInt(whole) * BigInt(1_000_000) + micros;
}

export { toMicroUnits };

function deductFee(amountMicros: bigint, feeBasisPoints: number): {
  netMicros: bigint;
  feeMicros: bigint;
} {
  const feeMicros = (amountMicros * BigInt(feeBasisPoints)) / BigInt(10000);
  return { netMicros: amountMicros - feeMicros, feeMicros };
}

function tradeIdFrom(payload: Record<string, Prisma.InputJsonValue>): number | null {
  const raw = payload.tradeId;
  if (raw === undefined || raw === null) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function amountFrom(payload: Record<string, Prisma.InputJsonValue>): bigint | null {
  const raw = payload.amount ?? payload.refundedAmount;
  if (raw === undefined || raw === null) return null;
  try {
    const value = BigInt(String(raw));
    return value >= BigInt(0) ? value : null;
  } catch {
    return null;
  }
}

export type LedgerEntryDraft = {
  category: LedgerCategoryValue;
  blockchainTradeId: number;
  amountMicros: bigint;
  feeMicros: bigint;
  feeBasisPoints: number | null;
  from: string | null;
  to: string | null;
};

/**
 * Maps an escrow event to one or more ledger movements. Returns an empty list
 * for events that do not move tokens or whose payload cannot be resolved.
 */
export function ledgerEntriesForEvent(
  eventName: string,
  payload: Record<string, Prisma.InputJsonValue>,
  ctx: Pick<LedgerContext, "feeBasisPoints">
): LedgerEntryDraft[] {
  const tradeId = tradeIdFrom(payload);
  if (tradeId === null) return [];
  const amount = amountFrom(payload);
  if (amount === null) return [];

  if (eventName === "TradeCreated") {
    return [
      {
        category: "DEPOSIT",
        blockchainTradeId: tradeId,
        amountMicros: amount,
        feeMicros: BigInt(0),
        feeBasisPoints: null,
        from: null, // buyer wallet filled by the DB layer
        to: null, // escrow holds the deposit
      },
    ];
  }

  if (eventName === "ReleaseApproved") {
    const { netMicros, feeMicros } = deductFee(amount, ctx.feeBasisPoints);
    return [
      {
        category: "RELEASE",
        blockchainTradeId: tradeId,
        amountMicros: netMicros,
        feeMicros: BigInt(0),
        feeBasisPoints: null,
        from: null,
        to: null, // seller wallet filled by the DB layer
      },
      {
        category: "FEE",
        blockchainTradeId: tradeId,
        amountMicros: feeMicros,
        feeMicros,
        feeBasisPoints: ctx.feeBasisPoints,
        from: null,
        to: null, // fee treasury
      },
    ];
  }

  if (
    eventName === "TradeTimedOut" ||
    eventName === "DisputeTimedOut" ||
    (eventName === "DisputeResolved" && payload.refundBuyer === true)
  ) {
    return [
      {
        category: "REFUND",
        blockchainTradeId: tradeId,
        amountMicros: amount,
        feeMicros: BigInt(0),
        feeBasisPoints: null,
        from: null, // escrow -> buyer wallet
        to: null,
      },
    ];
  }

  return [];
}

export type LedgerEntryMeta = {
  transactionHash: string;
  chainEventId: string;
  blockNumber: bigint;
};

/**
 * Applies an escrow event's token movements to the ledger, binding them to the
 * matching in-app trade (and buyer/seller wallets) when one exists.
 */
export async function applyEscrowLedgerEntries(
  db: DatabaseClient,
  ctx: LedgerContext,
  eventName: string,
  payload: Record<string, Prisma.InputJsonValue>,
  meta: LedgerEntryMeta
): Promise<LedgerEntryDraft[]> {
  const entries = ledgerEntriesForEvent(eventName, payload, ctx);
  if (entries.length === 0) return [];
  const trade = await db.tradeMetadata.findUnique({
    where: { blockchainTradeId: entries[0].blockchainTradeId },
    include: {
      buyer: { select: { walletAddress: true } },
      seller: { select: { walletAddress: true } },
    },
  });
  const buyerWallet = trade?.buyer.walletAddress ?? null;
  const sellerWallet = trade?.seller.walletAddress ?? null;
  for (const entry of entries) {
    const from =
      entry.category === "DEPOSIT"
        ? buyerWallet
        : entry.category === "RELEASE"
          ? null // escrow -> seller
          : entry.category === "REFUND"
            ? null // escrow -> buyer
            : null; // FEE: escrow -> treasury
    const to =
      entry.category === "RELEASE"
        ? sellerWallet
        : entry.category === "REFUND"
          ? buyerWallet
          : null;
    await db.ledgerEntry.create({
      data: {
        network: ctx.network,
        transactionHash: meta.transactionHash,
        chainEventId: meta.chainEventId,
        category: entry.category,
        blockchainTradeId: entry.blockchainTradeId,
        tradeId: trade?.id ?? null,
        amountMicros: entry.amountMicros,
        amountUsdc: formatUnits(entry.amountMicros, 6),
        feeMicros: entry.feeMicros,
        feeBasisPoints: entry.feeBasisPoints,
        from,
        to,
        blockNumber: meta.blockNumber,
      },
    });
  }
  return entries;
}

export function ledgerSummary(entries: { category: string; amountMicros: bigint }[]) {
  const totals: Record<LedgerCategoryValue, bigint> = {
    DEPOSIT: BigInt(0),
    RELEASE: BigInt(0),
    FEE: BigInt(0),
    REFUND: BigInt(0),
  };
  for (const entry of entries) {
    const key = entry.category as LedgerCategoryValue;
    if (key in totals) totals[key] += entry.amountMicros;
  }
  return {
    totals,
    microToUsdc: (v: bigint) => formatUnits(v, 6),
    toMicroUnits,
  };
}