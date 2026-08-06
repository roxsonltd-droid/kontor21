import { getAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateWalletRequest } from "@/lib/api-auth";
import { normalizeOrganizationSlug } from "@/lib/organization";

export async function GET(req: NextRequest) {
  const actorWallet = await authenticateWalletRequest(req, "");
  if (!actorWallet) {
    return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
  }

  const memberships = await prisma.organizationMembership.findMany({
    where: {
      user: { walletAddress: actorWallet },
      status: { in: ["ACTIVE", "INVITED"] },
    },
    include: {
      organization: {
        include: {
          _count: { select: { memberships: true, tradesAsBuyer: true, tradesAsSeller: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(memberships);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const actorWallet = await authenticateWalletRequest(req, rawBody);
    if (!actorWallet) {
      return NextResponse.json({ error: "Valid wallet signature required" }, { status: 401 });
    }
    const body = JSON.parse(rawBody) as { name?: string; slug?: string; vatNumber?: string };
    const name = body.name?.trim();
    const slug = normalizeOrganizationSlug(body.slug || name || "");
    const vatNumber = body.vatNumber?.trim().toUpperCase() || null;
    if (!name || name.length < 2 || name.length > 120 || slug.length < 2) {
      return NextResponse.json({ error: "Valid organization name and slug required" }, { status: 400 });
    }

    const organization = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { walletAddress: getAddress(actorWallet) },
        update: {},
        create: { walletAddress: getAddress(actorWallet), role: "TRADER" },
      });
      return tx.organization.create({
        data: {
          name,
          slug,
          vatNumber,
          memberships: {
            create: { userId: user.id, role: "OWNER", status: "ACTIVE" },
          },
        },
        include: { memberships: { include: { user: true } } },
      });
    });
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("[organization-create]", error);
    return NextResponse.json({ error: "Organization slug or VAT number already exists" }, { status: 409 });
  }
}
