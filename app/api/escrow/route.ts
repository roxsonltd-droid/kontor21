import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const required = ["productName", "quantity", "priceUsdc", "buyerWallet", "sellerWallet"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    let buyer = await prisma.user.findUnique({ where: { walletAddress: body.buyerWallet } });
    if (!buyer) {
      buyer = await prisma.user.create({
        data: { walletAddress: body.buyerWallet, companyName: body.buyerName || null, role: "TRADER" },
      });
    }

    let seller = await prisma.user.findUnique({ where: { walletAddress: body.sellerWallet } });
    if (!seller) {
      seller = await prisma.user.create({
        data: { walletAddress: body.sellerWallet, companyName: body.sellerName || null, role: "TRADER" },
      });
    }

    const trade = await prisma.tradeMetadata.create({
      data: {
        productName: body.productName,
        quantity: body.quantity,
        unit: body.unit || "tons",
        priceUsdc: body.priceUsdc,
        conditionDescription: body.conditionDescription || null,
        buyerId: buyer.id,
        sellerId: seller.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      status: "draft_created",
      tradeId: trade.id,
      blockchainTradeId: null,
      kontor21_url: `${req.nextUrl.origin}/trade/${trade.id}`,
      instructions: `Draft escrow created. Buyer and seller must open kontor21 and fund the escrow via MetaMask.`,
    });
  } catch (err) {
    console.error("[escrow-create]", err);
    return NextResponse.json({ error: "Failed to create escrow draft" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const trades = await prisma.tradeMetadata.findMany({
      include: { buyer: true, seller: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(trades);
  } catch (err) {
    console.error("[trades-list]", err);
    return NextResponse.json({ error: "Failed to list trades" }, { status: 500 });
  }
}
