import prisma from "./prisma";
import { isActiveProvider } from "./evidence-provider";

/**
 * Resolves a registered evidence provider by wallet address. Returns the
 * provider only when it exists, is ACTIVE, and is within its accreditation
 * validity window. Legacy providers not present in the registry return null so
 * existing behavior (User-role based checks) can remain the fallback.
 */
export async function findActiveEvidenceProvider(walletAddress: string) {
  const wallet = await prisma.evidenceProviderWallet.findUnique({
    where: { walletAddress },
    include: { provider: true },
  });
  if (!wallet) return null;
  const provider = wallet.provider;
  if (!isActiveProvider(provider)) return null;
  return provider;
}
