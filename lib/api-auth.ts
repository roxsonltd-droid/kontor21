import { NextRequest } from "next/server";
import { getAddress, verifyMessage } from "ethers";
import { buildAuthMessage } from "@/lib/auth-message";

const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

export function authenticateWalletRequest(req: NextRequest, body: string): string | null {
  const address = req.headers.get("x-wallet-address");
  const timestamp = req.headers.get("x-wallet-timestamp");
  const signature = req.headers.get("x-wallet-signature");

  if (!address || !timestamp || !signature) return null;

  const signedAt = Number(timestamp);
  if (!Number.isFinite(signedAt) || Math.abs(Date.now() - signedAt) > MAX_SIGNATURE_AGE_MS) {
    return null;
  }

  try {
    const message = buildAuthMessage(req.method, req.nextUrl.pathname, timestamp, body);
    const recovered = verifyMessage(message, signature);
    return getAddress(recovered) === getAddress(address) ? getAddress(address) : null;
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
