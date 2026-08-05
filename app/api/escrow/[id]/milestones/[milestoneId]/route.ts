import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { normalizeRuleSet } from "@/lib/milestone-rules";
import { milestoneAccess, snapshotRules } from "@/lib/milestone-route";

type RouteContext = { params: Promise<{ id: string; milestoneId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const { id, milestoneId } = await context.params;
    const access = await milestoneAccess(id, actorWallet);
    if (!access?.canWrite) {
      return NextResponse.json({ error: "Trade management permission required" }, { status: 403 });
    }
    if (access.trade.settlementStatus !== "AWAITING_FUNDS") {
      return NextResponse.json({ error: "Milestone rules are immutable after funding" }, { status: 409 });
    }

    const body = JSON.parse(rawBody) as {
      conditions?: Array<{
        parameter?: string;
        operator?: string;
        value?: string;
        unit?: string;
        providerRole?: "LAB" | "INSPECTOR" | "ORACLE" | "CARRIER";
        isRequired?: boolean;
      }>;
      changeNote?: string;
    };

    // Deleting every rule (empty set) would orphan the milestone conditions
    // policy; require at least one validated rule.
    const normalizedRules = normalizeRuleSet(body.conditions || []);
    if (!normalizedRules || normalizedRules.length === 0) {
      return NextResponse.json({ error: "At least one valid milestone condition required" }, { status: 400 });
    }

    const milestone = await prisma.tradeMilestone.findFirst({
      where: { id: milestoneId, tradeId: id },
      select: { id: true, rulesVersion: true },
    });
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    const nextVersion = milestone.rulesVersion + 1;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.tradeMilestone.update({
        where: { id: milestoneId },
        data: { rulesVersion: nextVersion },
      });
      await tx.tradeCondition.deleteMany({ where: { milestoneId } });
      await tx.tradeCondition.createMany({
        data: normalizedRules.map((rule) => ({
          tradeId: id,
          milestoneId,
          parameter: rule.parameter,
          operator: rule.operator,
          value: rule.value,
          unit: rule.unit,
          providerRole: rule.providerRole,
          isRequired: rule.isRequired,
        })),
      });
      // Freeze the previous policy version; append the new immutable snapshot.
      await tx.milestoneRules.updateMany({
        where: { milestoneId, supersededAt: null },
        data: { supersededAt: new Date() },
      });
      await tx.milestoneRules.create({
        data: snapshotRules(
          milestoneId,
          nextVersion,
          actorWallet,
          body.changeNote?.trim() || null,
          normalizedRules
        ),
      });
      return tx.tradeMilestone.findUnique({
        where: { id: milestoneId },
        include: {
          conditions: true,
          rules: { orderBy: { version: "asc" } },
        },
      });
    });

    await prisma.auditLog.create({
      data: { tradeId: id, action: "MILESTONE_RULES_UPDATED", actorWallet },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[milestone-rules-update]", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: "Milestone rules update failed" }, { status: 409 });
    }
    return NextResponse.json({ error: "Milestone rules update failed" }, { status: 500 });
  }
}
