import { NextRequest } from "next/server";
import { getAddress, verifyMessage } from "ethers";
import { buildAuthMessage } from "@/lib/auth-message";
import prisma from "@/lib/prisma";

const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

export async function authenticateWalletRequest(req: NextRequest, body: string): Promise<string | null> {
  const address = req.headers.get("x-wallet-address");
  const timestamp = req.headers.get("x-wallet-timestamp");
  const signature = req.headers.get("x-wallet-signature");
  const nonce = req.headers.get("x-wallet-nonce");
  const domain = req.headers.get("x-wallet-domain");
  const chainIdHeader = req.headers.get("x-wallet-chain-id");

  if (!address || !timestamp || !signature || !nonce || !domain || !chainIdHeader) return null;

  const signedAt = Number(timestamp);
  if (!Number.isFinite(signedAt) || Math.abs(Date.now() - signedAt) > MAX_SIGNATURE_AGE_MS) {
    return null;
  }

  try {
    const chainId = Number(chainIdHeader);
    const expectedChainId = Number(process.env.API_CHAIN_ID || 80002);
    const requestHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (!Number.isSafeInteger(chainId) || chainId !== expectedChainId || domain !== requestHost) {
      return null;
    }
    const message = buildAuthMessage(
      req.method,
      `${req.nextUrl.pathname}${req.nextUrl.search}`,
      timestamp,
      body,
      nonce,
      domain,
      chainId
    );
    const recovered = verifyMessage(message, signature);
    const normalizedAddress = getAddress(address);
    if (getAddress(recovered) !== normalizedAddress) return null;

    const consumed = await prisma.authNonce.updateMany({
      where: {
        nonce,
        walletAddress: normalizedAddress,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
    return consumed.count === 1 ? normalizedAddress : null;
  } catch {
    return null;
  }
}

export function isConfiguredArbitrator(address: string) {
  const configured = (process.env.ARBITRATOR_WALLETS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(address.toLowerCase());
}
