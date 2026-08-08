import type { KybStatus } from "@prisma/client";

// Nexus Core: Know Your Business verification flow.
// Pure state-machine logic so the rules can be unit-tested without a DB.

export const KYB_STATUSES = new Set<string>(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]);

export type KybChange =
  | "submit"
  | "approve"
  | "reject"
  | "None";

export type KybResolution =
  | { ok: true; nextStatus: KybStatus }
  | { ok: false; status: number; error: string };

/**
 * Decides how a KYB action transitions the current status, independent of the
 * database.
 *
 * - submit: an owner/admin sends the organization for review. Legal from
 *   UNVERIFIED or REJECTED (a rejected submission can be resubmitted after
 *   corrections). Requires organization admin permission.
 * - approve: a platform reviewer marks it verified from PENDING only.
 * - reject: a reviewer rejects a PENDING submission; a reason is required.
 *
 * VERIFIED is terminal in this version (re-verification requires a future
 * review cycle).
 */
export function resolveKybChange(params: {
  current: KybStatus;
  action: KybChange;
  actorIsManager: boolean;
  actorIsReviewer: boolean;
  reason?: string;
}): KybResolution {
  const { current, action, actorIsManager, actorIsReviewer, reason } = params;

  if (action === "submit") {
    if (!actorIsManager) {
      return { ok: false, status: 403, error: "Organization owner or admin required" };
    }
    if (current === "UNVERIFIED" || current === "REJECTED") {
      return { ok: true, nextStatus: "PENDING" };
    }
    return { ok: false, status: 409, error: "Only an unverified or rejected organization can be submitted" };
  }

  if (action === "approve") {
    if (!actorIsReviewer) {
      return { ok: false, status: 403, error: "Platform reviewer permission required" };
    }
    if (current === "PENDING") {
      return { ok: true, nextStatus: "VERIFIED" };
    }
    return { ok: false, status: 409, error: "Only a pending submission can be approved" };
  }

  if (action === "reject") {
    if (!actorIsReviewer) {
      return { ok: false, status: 403, error: "Platform reviewer permission required" };
    }
    if (current !== "PENDING") {
      return { ok: false, status: 409, error: "Only a pending submission can be rejected" };
    }
    if (!reason || !reason.trim()) {
      return { ok: false, status: 400, error: "A rejection reason is required" };
    }
    return { ok: true, nextStatus: "REJECTED" };
  }

  return { ok: false, status: 400, error: "Unknown KYB action" };
}