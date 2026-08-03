import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    // Let's find trades associated with this address if provided
    let tradeIds: number[] = [];
    if (address) {
      const user = await prisma.user.findUnique({
        where: { walletAddress: address },
        include: {
          buyerTrades: true,
          sellerTrades: true
        }
      });
      if (user) {
        tradeIds = [
          ...user.buyerTrades.map(t => t.id),
          ...user.sellerTrades.map(t => t.id)
        ];
      }
    }

    let whereClause = {};
    if (address && tradeIds.length > 0) {
      whereClause = {
        tradeId: { in: tradeIds }
      };
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      take: 50,
      include: {
        trade: {
          select: {
            productName: true,
            blockchainTradeId: true
          }
        }
      }
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error("[logs-list]", err);
    return NextResponse.json({ error: "Failed to list logs" }, { status: 500 });
  }
}
