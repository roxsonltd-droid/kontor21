import { getAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { EvidenceProviderStatus, ProviderRole } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

const STATUS_VALUES = new Set<string>(Object.values(EvidenceProviderStatus));
const PROVIDER_ROLES = new Set<string>(Object.values(ProviderRole));

async function assertManager(actorWallet: string, providerId: string) {
  const provider = await prisma.evidenceProvider.findUnique({
    where: { id: providerId },
    select: { organizationId: true },
  });
  if (!provider) return null;
  if (provider.organizationId) {
    const membership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId: provider.organizationId,
        user: { walletAddress: actorWallet },
        role: { in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
      },
    });
    if (!membership) return "Organization admin permission required";
  } else {
    const user = await prisma.user.findUnique({
      where: { walletAddress: actorWallet },
      select: { role: true },
    });
    if (!user || user.role !== "ADMIN") return "Platform admin permission required";
  }
  return null;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const denied = await assertManager(actorWallet, id);
    if (denied) {
      return NextResponse.json({ error: denied }, { status: 403 });
    }
    const body = JSON.parse(rawBody) as {
      status?: string;
      providerRole?: string;
      accreditationNo?: string;
      issuer?: string;
      validFrom?: string;
      validUntil?: string;
      jurisdiction?: string;
      addWallet?: string;
    };

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUS_VALUES.has(body.status)) {
        return NextResponse.json({ error: "Invalid provider status" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.providerRole !== undefined) {
      if (!PROVIDER_ROLES.has(body.providerRole)) {
        return NextResponse.json({ error: "Invalid provider role" }, { status: 400 });
      }
      data.providerRole = body.providerRole;
    }
    if (body.accreditationNo !== undefined) data.accreditationNo = body.accreditationNo?.trim() || null;
    if (body.issuer !== undefined) data.issuer = body.issuer?.trim() || null;
    if (body.jurisdiction !== undefined) data.jurisdiction = body.jurisdiction?.trim() || null;
    if (body.validFrom !== undefined) {
      const date = body.validFrom ? new Date(body.validFrom) : null;
      if (date && Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid validFrom date" }, { status: 400 });
      }
      data.validFrom = date;
    }
    if (body.validUntil !== undefined) {
      const date = body.validUntil ? new Date(body.validUntil) : null;
      if (date && Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid validUntil date" }, { status: 400 });
      }
      data.validUntil = date;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const provider = await tx.evidenceProvider.update({
        where: { id },
        data,
        include: { wallets: true, organization: true },
      });
      if (body.addWallet) {
        const walletAddress = getAddress(body.addWallet);
        await tx.evidenceProviderWallet.create({
          data: { providerId: id, walletAddress },
        });
      }
      return provider;
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[evidence-provider-update]", error);
    return NextResponse.json({ error: "Provider wallet already registered" }, { status: 409 });
  }
}
