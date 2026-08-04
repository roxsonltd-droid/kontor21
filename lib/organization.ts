import type { OrganizationRole } from "@prisma/client";

export const ORGANIZATION_ROLES = new Set<OrganizationRole>([
  "OWNER",
  "ADMIN",
  "TRADER",
  "ACCOUNTANT",
  "SIGNER",
  "VIEWER",
]);

export function normalizeOrganizationSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function canManageMembers(role: OrganizationRole) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageTrades(role: OrganizationRole) {
  return role === "OWNER" || role === "ADMIN" || role === "TRADER" || role === "SIGNER";
}
