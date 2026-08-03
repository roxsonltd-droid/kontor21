import { randomBytes } from "crypto";
import { getAddress, isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const NONCE_TTL_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { address?: string } | null;
  if (!body?.address || !isAddress(body.address)) {
    return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 });
  }

  const walletAddress = getAddress(body.address);
  const nonce = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await prisma.$transaction([
    prisma.authNonce.deleteMany({
      where: {
        OR: [
          { walletAddress, usedAt: null },
          { expiresAt: { lt: new Date() } },
        ],
      },
    }),
    prisma.authNonce.create({
      data: { walletAddress, nonce, expiresAt },
    }),
  ]);

  return NextResponse.json({
    nonce,
    expiresAt: expiresAt.toISOString(),
    chainId: Number(process.env.API_CHAIN_ID || 80002),
  });
}
