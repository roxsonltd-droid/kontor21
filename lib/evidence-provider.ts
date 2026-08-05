import type { EvidenceProviderStatus, EvidenceValidationStatus } from "@prisma/client";

/**
 * Minimal shape needed by the pure status helpers so they can be unit-tested
 * without a running Prisma client.
 */
export type ProviderStatusRow = {
  status: EvidenceProviderStatus;
  validFrom: Date | null;
  validUntil: Date | null;
  revokedAt: Date | null;
};

/**
 * True only for providers that are ACTIVE and within their accreditation
 * validity window. REVOKED wins over the calendar: a revoked certificate never
 * becomes usable again even if revoking predates validFrom.
 */
export function isActiveProvider(row: ProviderStatusRow): boolean {
  if (row.status === "REVOKED") return false;
  const derived = effectiveStatusFor(row, new Date());
  return derived === "ACTIVE";
}

/**
 * Derives the authoritative status of a provider, treating a past validUntil as
 * EXPIRED even when the stored status is still ACTIVE (deferred expiry). REVOKED
 * is terminal and never downgraded back to EXPIRED/ACTIVE.
 */
export function effectiveStatusFor(row: ProviderStatusRow, now: Date): EvidenceProviderStatus {
  if (row.status === "REVOKED" || row.status === "EXPIRED") return row.status as EvidenceProviderStatus;
  if (row.validFrom && row.validFrom > now) return "PENDING" as EvidenceProviderStatus;
  if (row.validUntil && row.validUntil < now) return "EXPIRED" as EvidenceProviderStatus;
  return row.status;
}

/**
 * Maps a provider's stored/derived status to the cascade value used for its
 * presently uploaded evidence. Only terminal statuses cascade; a PENDING status
 * change is intentionally not forced onto evidence rows.
 */
export function cascadeEvidenceStatus(status: EvidenceProviderStatus): EvidenceValidationStatus | null {
  switch (status) {
    case "REVOKED":
      return "REVOKED";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return null;
  }
}

/**
 * Pure decision for a REVOKE status transition. Returns a normalized Prisma
 * update payload for the provider, or null when the transition is not allowed
 * (e.g. already revoked, or missing a revocation reason).
 *
 * The caller is responsible for persisting the returned payload inside a
 * transaction and for cascading the resulting evidence status.
 */
export function revocationUpdate(
  { status, revokedAt }: ProviderStatusRow,
  actorWallet: string,
  reason: string | undefined,
  now = new Date(),
) {
  if (status === "REVOKED") return null;
  if (!reason || !reason.trim()) return null;
  return {
    status: "REVOKED" as EvidenceProviderStatus,
    revokedAt: revokedAt || now,
    revokedBy: actorWallet,
    revokedReason: reason.trim(),
  };
}
