import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const trade = await prisma.tradeMetadata.findUnique({
      where: { id },
      include: { 
        buyer: true, 
        seller: true,
        conditions: true,
        evidence: true
      },
    });

    if (!trade) {
      // Fallback to mock data for demo purposes if not found in DB
      return NextResponse.json({
        id,
        blockchainTradeId: 1,
        productName: "High-Oleic Sunflower Seeds",
        quantity: 50,
        unit: "Tons",
        priceUsdc: 1500,
        conditions: [
          { parameter: "moisture", operator: "<=", value: "8", unit: "%", providerRole: "LAB" }
        ],
        operationalStatus: "PENDING",
        settlementStatus: "AWAITING_FUNDS",
        buyer: { walletAddress: "0x1A2...3B4", companyName: "AgriBuyer GmbH" },
        seller: { walletAddress: "0x9D4...1F2", companyName: "BioFood BG Ltd." },
      });
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error("[escrow-read]", error);
    return NextResponse.json({ error: "Failed to load escrow draft" }, { status: 500 });
  }
}
