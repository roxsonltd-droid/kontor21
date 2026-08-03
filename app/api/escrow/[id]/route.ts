import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
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

    const body = await req.json();
    const data: { blockchainTradeId?: number | null; operationalStatus?: string; settlementStatus?: string } = {};

    if ("blockchainTradeId" in body) {
      data.blockchainTradeId =
        body.blockchainTradeId === null || body.blockchainTradeId === undefined
          ? null
          : parseInt(body.blockchainTradeId, 10);
    }

    if ("operationalStatus" in body && typeof body.operationalStatus === "string") {
      data.operationalStatus = body.operationalStatus;
    }

    if ("settlementStatus" in body && typeof body.settlementStatus === "string") {
      data.settlementStatus = body.settlementStatus;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
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
          actorWallet: "0xSystem",
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
