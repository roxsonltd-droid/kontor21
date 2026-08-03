import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest, isConfiguredArbitrator } from "@/lib/api-auth";
import type { OperationalStatus, SettlementStatus } from "@prisma/client";
import { isAuthorizedTradeTransition } from "@/lib/trade-transition-auth";
import {
  verifyOnchainTradeParticipants,
  verifyOnchainTradeStatus,
} from "@/lib/onchain-escrow";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const actorWallet = await authenticateWalletRequest(req, "");
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const { id } = await context.params;

    const isNumeric = /^\d+$/.test(id);
    const trade = isNumeric
      ? await prisma.tradeMetadata.findFirst({
          where: { blockchainTradeId: parseInt(id, 10) },
          include: { buyer: true, seller: true, oracle: true, conditions: true, evidence: true },
        })
      : await prisma.tradeMetadata.findUnique({
          where: { id },
          include: { buyer: true, seller: true, oracle: true, conditions: true, evidence: true },
        });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    const actor = actorWallet.toLowerCase();
    const canRead =
      trade.buyer.walletAddress.toLowerCase() === actor ||
      trade.seller.walletAddress.toLowerCase() === actor ||
      trade.oracle?.walletAddress.toLowerCase() === actor ||
      isConfiguredArbitrator(actorWallet);
    if (!canRead) {
      return NextResponse.json({ error: "Wallet is not authorized to read this trade" }, { status: 403 });
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error("[escrow-read]", error);
    return NextResponse.json({ error: "Failed to load escrow draft" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const draft = await prisma.tradeMetadata.findUnique({ where: { id } });
    if (!draft) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const body = JSON.parse(rawBody);
    const data: {
      blockchainTradeId?: number | null;
      operationalStatus?: OperationalStatus;
      settlementStatus?: SettlementStatus;
    } = {};

    if ("blockchainTradeId" in body) {
      const parsedTradeId =
        body.blockchainTradeId === null || body.blockchainTradeId === undefined
          ? null
          : parseInt(body.blockchainTradeId, 10);
      if (parsedTradeId !== null && (!Number.isSafeInteger(parsedTradeId) || parsedTradeId <= 0)) {
        return NextResponse.json({ error: "Invalid blockchainTradeId" }, { status: 400 });
      }
      data.blockchainTradeId = parsedTradeId;
    }

    if ("operationalStatus" in body && typeof body.operationalStatus === "string") {
      const allowedOperationalStatuses = ["PENDING", "SHIPPED", "INSPECTED", "CONDITIONS_SATISFIED", "DISPUTED"];
      if (!allowedOperationalStatuses.includes(body.operationalStatus)) {
        return NextResponse.json({ error: "Invalid operationalStatus" }, { status: 400 });
      }
      data.operationalStatus = body.operationalStatus as OperationalStatus;
    }

    if ("settlementStatus" in body && typeof body.settlementStatus === "string") {
      const allowedSettlementStatuses = ["AWAITING_FUNDS", "FUNDED", "RELEASED", "REFUNDED", "PARTIAL_SETTLEMENT", "DISPUTED"];
      if (!allowedSettlementStatuses.includes(body.settlementStatus)) {
        return NextResponse.json({ error: "Invalid settlementStatus" }, { status: 400 });
      }
      data.settlementStatus = body.settlementStatus as SettlementStatus;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const actor = actorWallet.toLowerCase();
    const fullDraft = await prisma.tradeMetadata.findUnique({
      where: { id },
      include: { buyer: true, seller: true, oracle: true },
    });
    if (!fullDraft) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    const isBuyer = fullDraft.buyer.walletAddress.toLowerCase() === actor;
    const isSeller = fullDraft.seller.walletAddress.toLowerCase() === actor;
    const isOracle = fullDraft.oracle?.walletAddress.toLowerCase() === actor;
    const isArbitrator = isConfiguredArbitrator(actorWallet);
    const allowed = isAuthorizedTradeTransition(data, {
      currentBlockchainTradeId: fullDraft.blockchainTradeId,
      currentOperationalStatus: fullDraft.operationalStatus,
      currentSettlementStatus: fullDraft.settlementStatus,
      isBuyer,
      isSeller,
      isOracle: Boolean(isOracle),
      isArbitrator,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Wallet is not authorized for this transition" }, { status: 403 });
    }

    const chainTradeId = data.blockchainTradeId ?? fullDraft.blockchainTradeId;
    if (!chainTradeId) {
      return NextResponse.json({ error: "Trade is not linked on-chain" }, { status: 409 });
    }
    try {
      let chainStateMatches = true;
      if (data.blockchainTradeId !== undefined) {
        chainStateMatches = await verifyOnchainTradeParticipants(chainTradeId, {
          buyer: fullDraft.buyer.walletAddress,
          seller: fullDraft.seller.walletAddress,
          oracle: fullDraft.oracle?.walletAddress,
        });
      } else if (data.settlementStatus === "FUNDED") {
        chainStateMatches = await verifyOnchainTradeStatus(chainTradeId, 1);
      } else if (
        data.operationalStatus === "DISPUTED" ||
        data.settlementStatus === "DISPUTED"
      ) {
        chainStateMatches = await verifyOnchainTradeStatus(chainTradeId, 3);
      } else if (data.settlementStatus === "RELEASED") {
        chainStateMatches = await verifyOnchainTradeStatus(chainTradeId, 2);
      } else if (data.settlementStatus === "REFUNDED") {
        chainStateMatches = await verifyOnchainTradeStatus(chainTradeId, 4);
      }
      if (!chainStateMatches) {
        return NextResponse.json({ error: "Requested transition does not match on-chain state" }, { status: 409 });
      }
    } catch (error) {
      console.error("[escrow-chain-verification]", error);
      return NextResponse.json({ error: "Unable to verify on-chain state" }, { status: 503 });
    }

    const updated = await prisma.tradeMetadata.update({
      where: { id: draft.id },
      data,
      include: { buyer: true, seller: true, oracle: true, conditions: true, evidence: true },
    });

    const actions: string[] = [];
    if (data.blockchainTradeId !== undefined && data.blockchainTradeId !== null) {
      actions.push("BLOCKCHAIN_LINKED");
    }
    if (data.settlementStatus === "FUNDED") actions.push("TRADE_FUNDED");
    if (data.settlementStatus === "RELEASED") actions.push("TRADE_APPROVED");
    if (data.settlementStatus === "REFUNDED") actions.push("TRADE_REFUNDED");
    if (data.operationalStatus === "DISPUTED") actions.push("TRADE_DISPUTED");
    if (data.operationalStatus === "CONDITIONS_SATISFIED") actions.push("CONDITIONS_SATISFIED");
    if (actions.length > 0) {
      await prisma.auditLog.create({
        data: {
          tradeId: draft.id,
          action: actions.join("|"),
          actorWallet,
          documentIpfsHash: null,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[escrow-patch]", error);
    return NextResponse.json({ error: "Failed to update escrow draft" }, { status: 500 });
  }
}
