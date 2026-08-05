import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { parsePositiveDecimalString } from "@/lib/money";
import { normalizeRuleSet, type RuleInput } from "@/lib/milestone-rules";
import { milestoneAccess, snapshotRules } from "@/lib/milestone-route";

type RouteContext = { params: Promise<{ id: string }> };

export type { RuleInput };

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
    include: {
      conditions: true,
      evidence: true,
      settlements: true,
      rules: { orderBy: { version: "asc" } },
    },
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
      conditions?: RuleInput[];
      changeNote?: string;
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
    const normalizedRules = normalizeRuleSet(body.conditions || []);
    if (!normalizedRules) {
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

    const milestone = await prisma.$transaction(async (tx) => {
      const created = await tx.tradeMilestone.create({
        data: {
          tradeId: id,
          sequence,
          title,
          description: body.description?.trim() || null,
          amountUsdc: amount,
          evidenceDueAt,
          acceptanceDueAt,
          status: "DRAFT",
          rulesVersion: 1,
          conditions: {
            create: normalizedRules.map((condition) => ({
              tradeId: id,
              parameter: condition.parameter,
              operator: condition.operator,
              value: condition.value,
              unit: condition.unit,
              providerRole: condition.providerRole,
              isRequired: condition.isRequired,
            })),
          },
        },
        include: { conditions: true, settlements: true },
      });
      await tx.milestoneRules.create({
        data: snapshotRules(
          created.id,
          1,
          actorWallet,
          body.changeNote?.trim() || null,
          normalizedRules
        ),
      });
      return created;
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
