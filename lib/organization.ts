import type { OrganizationRole } from "@prisma/client";

export const ORGANIZATION_ROLES = new Set<OrganizationRole>([
  "OWNER",
  "ADMIN",
  "TRADER",
  "ACCOUNTANT",
  "SIGNER",
  "VIEWER",
]);

export type Capability =
  | "trade.create"
  | "trade.sign"
  | "milestone.manage"
  | "settlement.approve"
  | "evidence.submit"
  | "member.manage";

const ROLE_CAPABILITIES: Record<OrganizationRole, readonly Capability[]> = {
  OWNER: [
    "trade.create",
    "trade.sign",
    "milestone.manage",
    "settlement.approve",
    "evidence.submit",
    "member.manage",
  ],
  ADMIN: [
    "trade.create",
    "trade.sign",
    "milestone.manage",
    "settlement.approve",
    "evidence.submit",
    "member.manage",
  ],
  TRADER: ["trade.create", "milestone.manage", "evidence.submit"],
  SIGNER: ["trade.sign", "settlement.approve"],
  ACCOUNTANT: ["settlement.approve"],
  VIEWER: [],
};

export function hasCapability(role: OrganizationRole, capability: Capability) {
  return ROLE_CAPABILITIES[role].includes(capability);
}

// Backward-compatible conveniences expressed through capabilities.
// Operating a trade means being able to create or sign one.
export function canManageTrades(role: OrganizationRole) {
  return hasCapability(role, "trade.create") || hasCapability(role, "trade.sign");
}

export function canManageMembers(role: OrganizationRole) {
  return hasCapability(role, "member.manage");
}

export function normalizeOrganizationSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
