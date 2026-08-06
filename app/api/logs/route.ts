import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const actorWallet = await authenticateWalletRequest(req, "");
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const address = req.nextUrl.searchParams.get("address");
    if (address && address.toLowerCase() !== actorWallet.toLowerCase()) {
      return NextResponse.json({ error: "Cannot list another wallet's logs" }, { status: 403 });
    }

    // Find trade UUIDs associated with this address if provided
    let tradeIds: string[] = [];
    const effectiveAddress = address || actorWallet;
    if (effectiveAddress) {
      const user = await prisma.user.findUnique({
        where: { walletAddress: effectiveAddress },
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

    const whereClause: { tradeId: { in: string[] } } = { tradeId: { in: tradeIds } };

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
