import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { hasCapability, resolveInvitationAction, type InvitationAction } from "@/lib/organization";

type RouteContext = { params: Promise<{ id: string; membershipId: string }> };

const ACTIONS = new Set<InvitationAction>(["accept", "reject", "cancel"]);

// Invitation flow for organization membership.
// - Invitee:  accept  -> ACTIVE, reject -> REVOKED
// - Manager:  cancel  -> REVOKED (withdraws the pending invitation)
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const { id, membershipId } = await context.params;

    const membership = await prisma.organizationMembership.findFirst({
      where: { id: membershipId, organizationId: id },
      include: { user: { select: { walletAddress: true } } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const body = JSON.parse(rawBody) as { action?: string };
    if (!body.action || !ACTIONS.has(body.action as InvitationAction)) {
      return NextResponse.json({ error: "Valid action (accept, reject, cancel) required" }, { status: 400 });
    }
    const action = body.action as InvitationAction;

    const actor = actorWallet.toLowerCase();
    const actorIsInvitee = membership.user.walletAddress.toLowerCase() === actor;

    const manager = await prisma.organizationMembership.findFirst({
      where: { organizationId: id, status: "ACTIVE", user: { walletAddress: actorWallet } },
      include: { user: { select: { walletAddress: true } } },
    });
    const actorIsManager = Boolean(manager && hasCapability(manager.role, "member.manage"));

    const resolution = resolveInvitationAction({
      membershipStatus: membership.status,
      action,
      actorIsInvitee,
      actorIsManager,
    });
    if (!resolution.ok) {
      return NextResponse.json({ error: resolution.error }, { status: resolution.status });
    }

    const updated = await prisma.organizationMembership.update({
      where: { id: membershipId },
      data: { status: resolution.nextStatus },
      include: {
        user: { select: { id: true, walletAddress: true, companyName: true } },
        organization: true,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[organization-membership-patch]", error);
    return NextResponse.json({ error: "Unable to update membership" }, { status: 500 });
  }
}