import { NextRequest, NextResponse } from "next/server";
import { ConditionOperator, Prisma, ProviderRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest, isConfiguredArbitrator } from "@/lib/api-auth";
import { hasCapability } from "@/lib/organization";
import { parsePositiveDecimalString } from "@/lib/money";

type RouteContext = { params: Promise<{ id: string }> };

const CONDITION_OPERATORS: Record<string, ConditionOperator> = {
  "<=": ConditionOperator.LTE,
  ">=": ConditionOperator.GTE,
  "<": ConditionOperator.LT,
  ">": ConditionOperator.GT,
  "==": ConditionOperator.EQ,
};
const PROVIDER_ROLES = new Set<ProviderRole>(Object.values(ProviderRole));

async function milestoneAccess(tradeId: string, actorWallet: string) {
  const trade = await prisma.tradeMetadata.findUnique({
    where: { id: tradeId },
    include: {
      buyer: true,
      seller: true,
      oracle: true,
      buyerOrganization: {
        include: { memberships: { where: { status: "ACTIVE" }, include: { user: true } } },
      },
      sellerOrganization: {
        include: { memberships: { where: { status: "ACTIVE" }, include: { user: true } } },
      },
    },
  });
  if (!trade) return null;
  const actor = actorWallet.toLowerCase();
  const directBuyer = trade.buyer.walletAddress.toLowerCase() === actor;
  const directSeller = trade.seller.walletAddress.toLowerCase() === actor;
  const oracle = trade.oracle?.walletAddress.toLowerCase() === actor;
  const buyerMembership = trade.buyerOrganization?.memberships.find(
    (membership) => membership.user.walletAddress.toLowerCase() === actor
  );
  const sellerMembership = trade.sellerOrganization?.memberships.find(
    (membership) => membership.user.walletAddress.toLowerCase() === actor
  );
  return {
    trade,
    canRead: Boolean(
      directBuyer ||
      directSeller ||
      oracle ||
      buyerMembership ||
      sellerMembership ||
      isConfiguredArbitrator(actorWallet)
    ),
    canWrite: Boolean(
      directBuyer ||
      directSeller ||
      (buyerMembership && hasCapability(buyerMembership.role, "milestone.manage")) ||
      (sellerMembership && hasCapability(sellerMembership.role, "milestone.manage"))
    ),
  };
}

export async function GET(req: NextRequest, context: RouteContext) {
  const actorWallet = await authenticateWalletRequest(req, "");
  if (!actorWallet) {
    return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
  }
  const { id } = await context.params;
  const access = await milestoneAccess(id, actorWallet);
  if (!access?.canRead) {
    return NextResponse.json({ error: "Trade participant access required" }, { status: 403 });
  }
  const milestones = await prisma.tradeMilestone.findMany({
    where: { tradeId: id },
    include: { conditions: true, evidence: true, settlements: true },
    orderBy: { sequence: "asc" },
  });
  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const { id } = await context.params;
    const access = await milestoneAccess(id, actorWallet);
    if (!access?.canWrite) {
      return NextResponse.json({ error: "Trade management permission required" }, { status: 403 });
    }
    if (access.trade.settlementStatus !== "AWAITING_FUNDS") {
      return NextResponse.json({ error: "Milestones are immutable after funding" }, { status: 409 });
    }

    const body = JSON.parse(rawBody) as {
      sequence?: number;
      title?: string;
      description?: string;
      amountUsdc?: string | number;
      evidenceDueAt?: string;
      acceptanceDueAt?: string;
      conditions?: Array<{
        parameter?: string;
        operator?: string;
        value?: string;
        unit?: string;
        providerRole?: ProviderRole;
        isRequired?: boolean;
      }>;
    };
    const sequence = Number(body.sequence);
    const title = body.title?.trim();
    let amount: Prisma.Decimal;
    try {
      amount = new Prisma.Decimal(parsePositiveDecimalString(body.amountUsdc, "amountUsdc"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid amountUsdc";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (!Number.isSafeInteger(sequence) || sequence <= 0 || !title || title.length > 160 || amount.lte(0)) {
      return NextResponse.json({ error: "Valid sequence, title, and positive amount required" }, { status: 400 });
    }
    const evidenceDueAt = body.evidenceDueAt ? new Date(body.evidenceDueAt) : null;
    const acceptanceDueAt = body.acceptanceDueAt ? new Date(body.acceptanceDueAt) : null;
    if (
      (evidenceDueAt && Number.isNaN(evidenceDueAt.getTime())) ||
      (acceptanceDueAt && Number.isNaN(acceptanceDueAt.getTime())) ||
      (evidenceDueAt && acceptanceDueAt && acceptanceDueAt <= evidenceDueAt)
    ) {
      return NextResponse.json({ error: "Invalid milestone deadlines" }, { status: 400 });
    }
    const conditions = body.conditions || [];
    const validConditions = conditions.every(
      (condition) =>
        Boolean(condition.parameter?.trim()) &&
        Boolean(condition.value?.trim()) &&
        Boolean(condition.operator && CONDITION_OPERATORS[condition.operator]) &&
        Boolean(condition.providerRole && PROVIDER_ROLES.has(condition.providerRole))
    );
    if (!validConditions) {
      return NextResponse.json({ error: "Invalid milestone condition" }, { status: 400 });
    }

    const allocated = await prisma.tradeMilestone.aggregate({
      where: { tradeId: id, status: { not: "CANCELLED" } },
      _sum: { amountUsdc: true },
    });
    const tradeTotal = access.trade.quantity.mul(access.trade.priceUsdc);
    const allocatedTotal = allocated._sum.amountUsdc || new Prisma.Decimal(0);
    if (allocatedTotal.add(amount).gt(tradeTotal)) {
      return NextResponse.json({ error: "Milestone allocation exceeds trade total" }, { status: 409 });
    }

    const milestone = await prisma.tradeMilestone.create({
      data: {
        tradeId: id,
        sequence,
        title,
        description: body.description?.trim() || null,
        amountUsdc: amount,
        evidenceDueAt,
        acceptanceDueAt,
        status: "DRAFT",
        conditions: {
          create: conditions.map((condition) => ({
            tradeId: id,
            parameter: condition.parameter!.trim(),
            operator: CONDITION_OPERATORS[condition.operator!],
            value: condition.value!.trim(),
            unit: condition.unit?.trim() || null,
            providerRole: condition.providerRole!,
            isRequired: condition.isRequired ?? true,
          })),
        },
      },
      include: { conditions: true, settlements: true },
    });
    await prisma.auditLog.create({
      data: { tradeId: id, action: "MILESTONE_CREATED", actorWallet },
    });
    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("[milestone-create]", error);
    return NextResponse.json({ error: "Milestone sequence already exists or request is invalid" }, { status: 409 });
  }
}
