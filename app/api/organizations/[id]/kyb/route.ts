import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { resolveKybChange, type KybChange } from "@/lib/kyb";

type RouteContext = { params: Promise<{ id: string }> };

const ACTIONS = new Set<string>(["submit", "approve", "reject"]);

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as {
      action?: string;
      kybCountry?: string;
      reason?: string;
    };
    const action = body.action as KybChange | undefined;
    if (!action || !ACTIONS.has(action)) {
      return NextResponse.json({ error: "A valid KYB action is required" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      select: { id: true, kybStatus: true },
    });
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // submit requires an active OWNER/ADMIN membership; review requires a
    // platform-grade admin user.
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: id,
        status: "ACTIVE",
        role: { in: ["OWNER", "ADMIN"] },
        user: { walletAddress: actorWallet },
      },
      select: { id: true },
    });
    const reviewer = await prisma.user.findUnique({
      where: { walletAddress: actorWallet },
      select: { role: true },
    });

    const decision = resolveKybChange({
      current: organization.kybStatus,
      action: action as KybChange,
      actorIsManager: !!membership,
      actorIsReviewer: reviewer?.role === "ADMIN",
      reason: body.reason,
    });
    if (!decision.ok) {
      return NextResponse.json({ error: decision.error }, { status: decision.status });
    }

    const now = new Date();
    const data: Record<string, unknown> = {
      kybStatus: decision.nextStatus,
    };
    if (action === "submit") {
      data.kybCountry = body.kybCountry?.trim() || null;
      data.kybVerifiedAt = null;
      data.kybVerifiedBy = null;
      data.kybRejectedAt = null;
      data.kybRejectedBy = null;
      data.kybRejectionReason = null;
    }
    if (action === "approve") {
      data.kybVerifiedAt = now;
      data.kybVerifiedBy = actorWallet;
      data.kybRejectedAt = null;
      data.kybRejectedBy = null;
      data.kybRejectionReason = null;
    }
    if (action === "reject") {
      data.kybRejectedAt = now;
      data.kybRejectedBy = actorWallet;
      data.kybRejectionReason = body.reason?.trim() || null;
    }

    const updated = await prisma.organization.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        kybStatus: true,
        kybCountry: true,
        kybVerifiedAt: true,
        kybVerifiedBy: true,
        kybRejectedAt: true,
        kybRejectedBy: true,
        kybRejectionReason: true,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[kyb-update]", error);
    return NextResponse.json({ error: "Failed to update KYB status" }, { status: 500 });
  }
}