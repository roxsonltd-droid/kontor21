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

// Ordered declaration of every capability; used for stable
// effective-capability listing and input validation.
export const ALL_CAPABILITIES = [
  "trade.create",
  "trade.sign",
  "milestone.manage",
  "settlement.approve",
  "evidence.submit",
  "member.manage",
] as const satisfies readonly Capability[];

export function isCapability(value: string): value is Capability {
  return (ALL_CAPABILITIES as readonly string[]).includes(value);
}

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

// Nexus Core: Fine-grained custom permission policies.
// A membership carries per-member capability overrides layered over the role's
// default capability set: `grantedCapabilities` adds capabilities, and
// `revokedCapabilities` removes them. Pure + unit-testable without a database.
export function effectiveCapabilities(params: {
  role: OrganizationRole;
  grantedCapabilities?: readonly string[];
  revokedCapabilities?: readonly string[];
}): Capability[] {
  const granted = (params.grantedCapabilities ?? []).filter(isCapability);
  const revoked = new Set((params.revokedCapabilities ?? []).filter(isCapability));
  const effective = new Set<Capability>([...ROLE_CAPABILITIES[params.role], ...granted]);
  for (const capability of revoked) effective.delete(capability);
  return ALL_CAPABILITIES.filter((capability) => effective.has(capability));
}

export function hasEffectiveCapability(
  member: {
    role: OrganizationRole;
    grantedCapabilities?: readonly string[];
    revokedCapabilities?: readonly string[];
  },
  capability: Capability
) {
  return effectiveCapabilities(member).includes(capability);
}

// Validates a desired override and returns either the new capability arrays or
// a rejection reason. Rejects unknown names and capabilities denied outright.
export type CapabilityOverrideResolution =
  | { ok: true; grantedCapabilities: string[]; revokedCapabilities: string[] }
  | { ok: false; status: number; error: string };

export function resolveCapabilityOverrides(params: {
  grant?: unknown;
  revoke?: unknown;
}): CapabilityOverrideResolution {
  const invalid = (value: unknown) =>
    !Array.isArray(value) || value.some((item) => typeof item !== "string" || !isCapability(item));
  if (params.grant !== undefined && invalid(params.grant)) {
    return { ok: false, status: 400, error: "grant must be an array of known capabilities" };
  }
  if (params.revoke !== undefined && invalid(params.revoke)) {
    return { ok: false, status: 400, error: "revoke must be an array of known capabilities" };
  }
  const grant = [...(params.grant as string[] | undefined ?? [])];
  const revoke = [...(params.revoke as string[] | undefined ?? [])];
  if (new Set(grant).size !== grant.length || new Set(revoke).size !== revoke.length) {
    return { ok: false, status: 400, error: "Capability lists cannot contain duplicates" };
  }
  const overlapping = grant.find((capability) => revoke.includes(capability));
  if (overlapping) {
    return { ok: false, status: 400, error: `Capability ${overlapping} cannot be granted and revoked together` };
  }
  return { ok: true, grantedCapabilities: grant, revokedCapabilities: revoke };
}

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
