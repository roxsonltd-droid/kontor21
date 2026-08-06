import { getAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { EvidenceProviderStatus, ProviderRole } from "@prisma/client";
import { cascadeEvidenceStatus, revocationUpdate } from "@/lib/evidence-provider";

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
      issuerSlug?: string;
      validFrom?: string;
      validUntil?: string;
      jurisdiction?: string;
      addWallet?: string;
      revokedReason?: string;
    };

    const data: Record<string, unknown> = {};

    const current = await prisma.evidenceProvider.findUnique({
      where: { id },
      select: { id: true, status: true, validFrom: true, validUntil: true, revokedAt: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Evidence provider not found" }, { status: 404 });
    }

    // A REVOKE is a terminal, reason-required transition that cascades to every
    // piece of evidence this provider has uploaded.
    const revokePayload =
      body.status === "REVOKED" ? revocationUpdate(current, actorWallet, body.revokedReason) : null;
    if (body.status === "REVOKED" && !revokePayload) {
      return NextResponse.json(
        { error: "Revocation requires a non-empty revokedReason and an eligible provider" },
        { status: 400 },
      );
    }

    if (body.status !== undefined) {
      if (!STATUS_VALUES.has(body.status)) {
        return NextResponse.json({ error: "Invalid provider status" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (revokePayload) Object.assign(data, revokePayload);
    if (body.providerRole !== undefined) {
      if (!PROVIDER_ROLES.has(body.providerRole)) {
        return NextResponse.json({ error: "Invalid provider role" }, { status: 400 });
      }
      data.providerRole = body.providerRole;
    }
    if (body.accreditationNo !== undefined) data.accreditationNo = body.accreditationNo?.trim() || null;
    if (body.issuerSlug !== undefined) {
      const issuerSlug = body.issuerSlug.trim();
      const issuerRef = issuerSlug
        ? await prisma.accreditationIssuer.findUnique({ where: { slug: issuerSlug.toLowerCase() } })
        : null;
      if (issuerSlug && !issuerRef) {
        return NextResponse.json({ error: "Unknown accreditation issuer slug" }, { status: 400 });
      }
      data.issuerId = issuerRef?.id ?? null;
    } else if (body.issuer !== undefined) {
      if (body.issuer?.trim()) {
        const issuerName = body.issuer.trim();
        const issuerSlug = issuerName
          .normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
        const issuerRef = await prisma.accreditationIssuer.upsert({
          where: { slug: issuerSlug },
          update: {},
          create: { name: issuerName, slug: issuerSlug },
        });
        data.issuerId = issuerRef.id;
        data.issuer = issuerName;
      } else {
        data.issuer = null;
        data.issuerId = null;
      }
    }
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
      // Cascade a terminal status to evidence already uploaded by this provider.
      // Only a transition that actually lands on REVOKED/EXPIRED cascades; a
      // reactivation to ACTIVE does not silently resurrect revoked evidence.
      const cascade = body.status ? cascadeEvidenceStatus(provider.status as EvidenceProviderStatus) : null;
      if (cascade) {
        await tx.evidence.updateMany({
          where: { providerId: id, validationStatus: { not: cascade } },
          data: { validationStatus: cascade },
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
