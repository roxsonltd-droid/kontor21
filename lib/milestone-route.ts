import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isConfiguredArbitrator } from "@/lib/api-auth";
import { hasCapability } from "@/lib/organization";
import {
  buildRulesSnapshot,
  type NormalizedRule,
} from "@/lib/milestone-rules";

// Nexus Core: Shared helpers for milestone routes. Kept out of the route file
// because Next.js only allows route handlers as exports there.

export function snapshotRules(
  milestoneId: string,
  version: number,
  createdBy: string,
  changeNote: string | null,
  rules: NormalizedRule[]
) {
  return {
    milestoneId,
    version,
    createdBy,
    changeNote,
    conditions: buildRulesSnapshot(rules) as unknown as Prisma.InputJsonValue,
  };
}

export async function milestoneAccess(tradeId: string, actorWallet: string) {
  const trade = await prisma.tradeMetadata.findUnique({
    where: { id: tradeId },
    include: {
      buyer: true,
      seller: true,
      oracle: true,
      buyerOrganization: {
        include: { memberships: { where: { status: "ACTIVE" }, include: { user: true } } },
      },
      sellerOrganization: {
        include: { memberships: { where: { status: "ACTIVE" }, include: { user: true } } },
      },
    },
  });
  if (!trade) return null;
  const actor = actorWallet.toLowerCase();
  const directBuyer = trade.buyer.walletAddress.toLowerCase() === actor;
  const directSeller = trade.seller.walletAddress.toLowerCase() === actor;
  const oracle = trade.oracle?.walletAddress.toLowerCase() === actor;
  const buyerMembership = trade.buyerOrganization?.memberships.find(
    (membership) => membership.user.walletAddress.toLowerCase() === actor
  );
  const sellerMembership = trade.sellerOrganization?.memberships.find(
    (membership) => membership.user.walletAddress.toLowerCase() === actor
  );
  return {
    trade,
    canRead: Boolean(
      directBuyer ||
      directSeller ||
      oracle ||
      buyerMembership ||
      sellerMembership ||
      isConfiguredArbitrator(actorWallet)
    ),
    canWrite: Boolean(
      directBuyer ||
      directSeller ||
      (buyerMembership && hasCapability(buyerMembership.role, "milestone.manage")) ||
      (sellerMembership && hasCapability(sellerMembership.role, "milestone.manage"))
    ),
  };
}
