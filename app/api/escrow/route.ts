import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PUBLIC_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://kontor21.onrender.com"
).replace(/\/$/, "");

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

    let oracle = null;
    if (body.oracleWallet) {
      oracle = await prisma.user.findUnique({ where: { walletAddress: body.oracleWallet } });
      if (!oracle) {
        oracle = await prisma.user.create({
          data: { walletAddress: body.oracleWallet, companyName: body.oracleName || null, role: "ORACLE" },
        });
      }
    }

    // Prepare nested conditions creation if provided
    let conditionsCreate = undefined;
    if (body.conditions && Array.isArray(body.conditions)) {
      conditionsCreate = {
        create: body.conditions.map((c: { parameter: string; operator: string; value: string; unit?: string | null; providerRole?: string; isRequired?: boolean }) => ({
          parameter: c.parameter,
          operator: c.operator,
          value: c.value,
          unit: c.unit || null,
          providerRole: c.providerRole || "INSPECTOR",
          isRequired: c.isRequired !== undefined ? c.isRequired : true
        }))
      };
    }

    const trade = await prisma.tradeMetadata.create({
      data: {
        productName: body.productName,
        quantity: body.quantity,
        unit: body.unit || "tons",
        priceUsdc: body.priceUsdc,
        buyerId: buyer.id,
        sellerId: seller.id,
        oracleId: oracle?.id || null,
        operationalStatus: "PENDING",
        settlementStatus: "AWAITING_FUNDS",
        conditions: conditionsCreate
      },
      include: {
        conditions: true
      }
    });

    await prisma.auditLog.create({
      data: {
        tradeId: trade.id,
        action: "TRADE_CREATED",
        actorWallet: body.buyerWallet,
        documentIpfsHash: null,
      },
    });

    return NextResponse.json({
      status: "draft_created",
      tradeId: trade.id,
      blockchainTradeId: null,
      kontor21_url: `${PUBLIC_ORIGIN}/trade/${trade.id}`,
      instructions: `Draft escrow created with structured conditions.`,
    });
  } catch (err) {
    console.error("[escrow-create]", err);
    return NextResponse.json({ error: "Failed to create escrow draft" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    const role = req.nextUrl.searchParams.get("role");
    const disputes = req.nextUrl.searchParams.get("disputes");
    
    let whereClause: Record<string, unknown> = {};
    if (disputes === "1") {
      whereClause = {
        operationalStatus: "DISPUTED",
        blockchainTradeId: { not: null },
      };
    } else if (address && role === "oracle") {
      whereClause = { oracle: { walletAddress: address } };
    } else if (address) {
      whereClause = {
        OR: [
          { buyer: { walletAddress: address } },
          { seller: { walletAddress: address } }
        ]
      };
    }

    const trades = await prisma.tradeMetadata.findMany({
      where: whereClause,
      include: { buyer: true, seller: true, oracle: true, conditions: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(trades);
  } catch (err) {
    console.error("[trades-list]", err);
    return NextResponse.json({ error: "Failed to list trades" }, { status: 500 });
  }
}
