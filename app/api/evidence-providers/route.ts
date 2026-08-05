import { getAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { normalizeOrganizationSlug } from "@/lib/organization";
import { ProviderRole } from "@prisma/client";

const ACCREDITATION_NO = /^[A-Za-z0-9._-]+$/;
const PROVIDER_ROLES = new Set<string>(Object.values(ProviderRole));

export async function GET(req: NextRequest) {
  const actorWallet = await authenticateWalletRequest(req, "");
  if (!actorWallet) {
    return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
  }
  const providers = await prisma.evidenceProvider.findMany({
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      wallets: { select: { walletAddress: true } },
      _count: { select: { evidence: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ providers });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const body = JSON.parse(rawBody) as {
      name?: string;
      slug?: string;
      providerRole?: string;
      organizationId?: string;
      accreditationNo?: string;
      issuer?: string;
      issuerSlug?: string;
      validFrom?: string;
      validUntil?: string;
      jurisdiction?: string;
      wallets?: string[];
    };
    const name = body.name?.trim();
    const slug = normalizeOrganizationSlug(body.slug || name || "");
    if (!name || name.length < 2 || name.length > 120 || slug.length < 2) {
      return NextResponse.json({ error: "Valid provider name and slug required" }, { status: 400 });
    }
    if (body.providerRole !== undefined && !PROVIDER_ROLES.has(body.providerRole)) {
      return NextResponse.json({ error: "Invalid provider role" }, { status: 400 });
    }
    if (body.organizationId) {
      const membership = await prisma.organizationMembership.findFirst({
        where: {
          organizationId: body.organizationId,
          user: { walletAddress: actorWallet },
          role: { in: ["OWNER", "ADMIN"] },
          status: "ACTIVE",
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Organization admin permission required" }, { status: 403 });
      }
    }
    if (body.accreditationNo !== undefined && body.accreditationNo !== null) {
      const accreditationNo = body.accreditationNo.trim();
      if (!ACCREDITATION_NO.test(accreditationNo)) {
        return NextResponse.json({ error: "Invalid accreditation number" }, { status: 400 });
      }
    }
    const walletAddresses =
      body.wallets?.map((wallet) => getAddress(wallet)).filter(Boolean) ?? [];
    if (new Set(walletAddresses).size !== walletAddresses.length) {
      return NextResponse.json({ error: "Duplicate provider wallets" }, { status: 400 });
    }
    const validFrom = body.validFrom ? new Date(body.validFrom) : null;
    const validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (validFrom && Number.isNaN(validFrom.getTime())) {
      return NextResponse.json({ error: "Invalid validFrom date" }, { status: 400 });
    }
    if (validUntil && Number.isNaN(validUntil.getTime())) {
      return NextResponse.json({ error: "Invalid validUntil date" }, { status: 400 });
    }
    if (validFrom && validUntil && validUntil <= validFrom) {
      return NextResponse.json({ error: "validUntil must be after validFrom" }, { status: 400 });
    }

    const provider = await prisma.$transaction(async (tx) => {
      let issuerRefId: string | null = null;
      if (body.issuerSlug) {
        const issuerRef = await tx.accreditationIssuer.findUnique({
          where: { slug: normalizeOrganizationSlug(body.issuerSlug) },
        });
        if (!issuerRef) {
          return NextResponse.json({ error: "Unknown accreditation issuer slug" }, { status: 400 });
        }
        issuerRefId = issuerRef.id;
      } else if (body.issuer?.trim()) {
        const issuerName = body.issuer.trim();
        const issuerSlug = normalizeOrganizationSlug(issuerName);
        const issuerRef = await tx.accreditationIssuer.upsert({
          where: { slug: issuerSlug },
          update: {},
          create: { name: issuerName, slug: issuerSlug },
        });
        issuerRefId = issuerRef.id;
      }
      return tx.evidenceProvider.create({
        data: {
          name,
          slug,
          providerRole: (body.providerRole as ProviderRole) || null,
          organizationId: body.organizationId || null,
          accreditationNo: body.accreditationNo?.trim() || null,
          issuer: body.issuer?.trim() || null,
          issuerId: issuerRefId,
          validFrom,
          validUntil,
          jurisdiction: body.jurisdiction?.trim() || null,
          status: "PENDING",
          wallets: walletAddresses.length
            ? { create: walletAddresses.map((walletAddress) => ({ walletAddress })) }
            : undefined,
        },
        include: { wallets: true, organization: true, issuerRef: true },
      });
    });
    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error("[evidence-provider-create]", error);
    return NextResponse.json({ error: "Provider slug or wallet address already exists" }, { status: 409 });
  }
}
