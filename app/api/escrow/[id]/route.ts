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
      include: { buyer: true, seller: true },
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
