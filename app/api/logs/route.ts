import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    // Find trade UUIDs associated with this address if provided
    let tradeIds: string[] = [];
    if (address) {
      const user = await prisma.user.findUnique({
        where: { walletAddress: address },
        include: {
          tradesAsBuyer: { select: { id: true } },
          tradesAsSeller: { select: { id: true } },
          tradesAsOracle: { select: { id: true } },
        },
      });
      if (user) {
        tradeIds = [
          ...user.tradesAsBuyer.map((t) => t.id),
          ...user.tradesAsSeller.map((t) => t.id),
          ...user.tradesAsOracle.map((t) => t.id),
        ];
      }
    }

    let whereClause: { tradeId?: { in: string[] } } = {};
    if (address && tradeIds.length > 0) {
      whereClause = { tradeId: { in: tradeIds } };
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        trade: {
          select: {
            productName: true,
            blockchainTradeId: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error("[logs-list]", err);
    return NextResponse.json({ error: "Failed to list logs" }, { status: 500 });
  }
}
