import type { MembershipStatus, OrganizationRole } from "@prisma/client";

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

// Nexus Core: Invitation flow rules.
export const INVITATION_ACTIONS = ["accept", "reject", "cancel"] as const;
export type InvitationAction = (typeof INVITATION_ACTIONS)[number];

export type InvitationResolution =
  | { ok: true; nextStatus: "ACTIVE" | "REVOKED" }
  | { ok: false; status: number; error: string };

// Decides how an invitation action resolves a membership, independent of the
// database, so the rules can be unit-tested.
// - Only a pending (INVITED) membership can be resolved.
// - accept/reject are available to the invitee only.
// - cancel is available to an active member with member.manage capability.
export function resolveInvitationAction(params: {
  membershipStatus: MembershipStatus;
  action: InvitationAction;
  actorIsInvitee: boolean;
  actorIsManager: boolean;
}): InvitationResolution {
  const { membershipStatus, action, actorIsInvitee, actorIsManager } = params;

  if (membershipStatus !== "INVITED") {
    return { ok: false, status: 409, error: "Only pending invitations can be resolved" };
  }

  if (action === "accept" || action === "reject") {
    if (!actorIsInvitee) {
      return { ok: false, status: 403, error: "Only the invited wallet can accept or reject" };
    }
    return { ok: true, nextStatus: action === "accept" ? "ACTIVE" : "REVOKED" };
  }

  // action === "cancel"
  if (!actorIsManager) {
    return { ok: false, status: 403, error: "Organization owner or admin required" };
  }
  return { ok: true, nextStatus: "REVOKED" };
}
