import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest, isConfiguredArbitrator } from "@/lib/api-auth";
import { getAddress, isAddress } from "ethers";
import { ConditionOperator, ProviderRole } from "@prisma/client";
import { canManageTrades } from "@/lib/organization";
import { ensureOwnedOrganizationForUser } from "@/lib/organization-backfill";
import { parsePositiveDecimalString } from "@/lib/money";

const CONDITION_OPERATORS: Record<string, ConditionOperator> = {
  "<=": ConditionOperator.LTE,
  ">=": ConditionOperator.GTE,
  "<": ConditionOperator.LT,
  ">": ConditionOperator.GT,
  "==": ConditionOperator.EQ,
};
const PROVIDER_ROLES = new Set<ProviderRole>(Object.values(ProviderRole));

const PUBLIC_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://kontor21.onrender.com"
).replace(/\/$/, "");

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const body = JSON.parse(rawBody);

    const required = ["productName", "quantity", "priceUsdc", "buyerWallet", "sellerWallet"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    if (!isAddress(body.buyerWallet) || !isAddress(body.sellerWallet)) {
      return NextResponse.json({ error: "Invalid buyer or seller wallet" }, { status: 400 });
    }
    let quantity: string;
    let priceUsdc: string;
    try {
      quantity = parsePositiveDecimalString(body.quantity, "quantity");
      priceUsdc = parsePositiveDecimalString(body.priceUsdc, "priceUsdc");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid quantity or price";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (getAddress(body.sellerWallet) !== actorWallet) {
      return NextResponse.json({ error: "Seller wallet must sign the request" }, { status: 403 });
    }

    const buyer = await prisma.user.upsert({
      where: { walletAddress: getAddress(body.buyerWallet) },
      update: {},
      create: { walletAddress: getAddress(body.buyerWallet), companyName: body.buyerName || null, role: "TRADER" },
    });
    await ensureOwnedOrganizationForUser(buyer.id, body.buyerName, body.buyerVatNumber);

    const seller = await prisma.user.upsert({
      where: { walletAddress: actorWallet },
      update: {},
      create: { walletAddress: actorWallet, companyName: body.sellerName || null, role: "TRADER" },
    });
    await ensureOwnedOrganizationForUser(seller.id, body.sellerName, body.sellerVatNumber);

    let buyerOrganizationId: string | null = null;
    let sellerOrganizationId: string | null = null;
    if (body.sellerOrganizationId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          organizationId: body.sellerOrganizationId,
          userId: seller.id,
          status: "ACTIVE",
        },
      });
      if (!membership || !canManageTrades(membership.role)) {
        return NextResponse.json({ error: "Seller organization trading permission required" }, { status: 403 });
      }
      sellerOrganizationId = body.sellerOrganizationId;
    }
    if (body.buyerOrganizationId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          organizationId: body.buyerOrganizationId,
          userId: buyer.id,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Buyer is not an active member of the selected organization" }, { status: 400 });
      }
      buyerOrganizationId = body.buyerOrganizationId;
    }

    let oracle = null;
    if (body.oracleWallet && isAddress(body.oracleWallet)) {
      const oracleAddress = getAddress(body.oracleWallet);
      oracle = await prisma.user.upsert({
        where: { walletAddress: oracleAddress },
        update: {},
        create: { walletAddress: oracleAddress, companyName: body.oracleName || null, role: "ORACLE" },
      });
      await ensureOwnedOrganizationForUser(oracle.id, body.oracleName, body.oracleVatNumber);
    }

    // Prepare nested conditions creation if provided
    let conditionsCreate = undefined;
    if (body.conditions && Array.isArray(body.conditions)) {
      const validConditions = body.conditions.every(
        (condition: { operator?: string; providerRole?: string }) =>
          Boolean(condition.operator && CONDITION_OPERATORS[condition.operator]) &&
          Boolean(condition.providerRole && PROVIDER_ROLES.has(condition.providerRole as ProviderRole))
      );
      if (!validConditions) {
        return NextResponse.json({ error: "Invalid condition operator or provider role" }, { status: 400 });
      }
      conditionsCreate = {
        create: body.conditions.map((c: { parameter: string; operator: string; value: string; unit?: string | null; providerRole?: string; isRequired?: boolean }) => ({
          parameter: c.parameter,
          operator: CONDITION_OPERATORS[c.operator],
          value: c.value,
          unit: c.unit || null,
          providerRole: c.providerRole as ProviderRole,
          isRequired: c.isRequired !== undefined ? c.isRequired : true
        }))
      };
    }

    const trade = await prisma.tradeMetadata.create({
      data: {
        productName: body.productName,
        quantity,
        unit: body.unit || "tons",
        priceUsdc,
        buyerId: buyer.id,
        sellerId: seller.id,
        oracleId: oracle?.id || null,
        buyerOrganizationId,
        sellerOrganizationId,
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
        actorWallet,
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
    const actorWallet = await authenticateWalletRequest(req, "");
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const address = req.nextUrl.searchParams.get("address");
    const role = req.nextUrl.searchParams.get("role");
    const disputes = req.nextUrl.searchParams.get("disputes");
    
    let whereClause: Record<string, unknown> = {};
    if (address && address.toLowerCase() !== actorWallet.toLowerCase()) {
      return NextResponse.json({ error: "Cannot list another wallet's trades" }, { status: 403 });
    }
    if (disputes === "1") {
      if (!isConfiguredArbitrator(actorWallet)) {
        return NextResponse.json({ error: "Arbitrator access required" }, { status: 403 });
      }
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
    } else if (!isConfiguredArbitrator(actorWallet)) {
      whereClause = {
        OR: [
          { buyer: { walletAddress: actorWallet } },
          { seller: { walletAddress: actorWallet } },
          { oracle: { walletAddress: actorWallet } },
        ],
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
