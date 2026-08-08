import { getAddress, isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import type { OrganizationRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { hasEffectiveCapability, ORGANIZATION_ROLES } from "@/lib/organization";

type RouteContext = { params: Promise<{ id: string }> };

async function managerMembership(organizationId: string, walletAddress: string) {
  return prisma.organizationMembership.findFirst({
    where: {
      organizationId,
      status: "ACTIVE",
      user: { walletAddress },
    },
  });
}

export async function GET(req: NextRequest, context: RouteContext) {
  const actorWallet = await authenticateWalletRequest(req, "");
  if (!actorWallet) {
    return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
  }
  const { id } = await context.params;
  const membership = await managerMembership(id, actorWallet);
  if (!membership) {
    return NextResponse.json({ error: "Active organization membership required" }, { status: 403 });
  }
  const members = await prisma.organizationMembership.findMany({
    where: { organizationId: id },
    include: { user: { select: { id: true, walletAddress: true, companyName: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(members);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const rawBody = await req.text();
  const actorWallet = await authenticateWalletRequest(req, rawBody);
  if (!actorWallet) {
    return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
  }
  const { id } = await context.params;
  const manager = await managerMembership(id, actorWallet);
  if (!manager || !hasEffectiveCapability(manager, "member.manage")) {
    return NextResponse.json({ error: "Organization owner or admin required" }, { status: 403 });
  }

  const body = JSON.parse(rawBody) as { walletAddress?: string; role?: OrganizationRole };
  if (!body.walletAddress || !isAddress(body.walletAddress) || !body.role || !ORGANIZATION_ROLES.has(body.role)) {
    return NextResponse.json({ error: "Valid wallet address and organization role required" }, { status: 400 });
  }
  if (body.role === "OWNER" && manager.role !== "OWNER") {
    return NextResponse.json({ error: "Only an owner can appoint another owner" }, { status: 403 });
  }

  const membership = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { walletAddress: getAddress(body.walletAddress!) },
      update: {},
      create: { walletAddress: getAddress(body.walletAddress!), role: "TRADER" },
    });
    return tx.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId: id, userId: user.id } },
      update: { role: body.role!, status: "INVITED" },
      create: { organizationId: id, userId: user.id, role: body.role!, status: "INVITED" },
      include: { user: true, organization: true },
    });
  });
  return NextResponse.json(membership, { status: 201 });
}
