import { expect } from "chai";
import {
  canManageMembers,
  canManageTrades,
  effectiveCapabilities,
  hasCapability,
  hasEffectiveCapability,
  isCapability,
  normalizeOrganizationSlug,
  resolveCapabilityOverrides,
  resolveInvitationAction,
} from "../lib/organization.ts";

describe("organization domain helpers", function () {
  it("normalizes user-supplied organization slugs", function () {
    expect(normalizeOrganizationSlug("  Kontor 21 Europe!  ")).to.equal("kontor-21-europe");
  });

  it("limits membership administration to owners and admins", function () {
    expect(canManageMembers("OWNER")).to.equal(true);
    expect(canManageMembers("ADMIN")).to.equal(true);
    expect(canManageMembers("TRADER")).to.equal(false);
    expect(canManageMembers("VIEWER")).to.equal(false);
  });

  it("separates trade operators from read-only and accounting roles", function () {
    expect(canManageTrades("SIGNER")).to.equal(true);
    expect(canManageTrades("TRADER")).to.equal(true);
    expect(canManageTrades("ACCOUNTANT")).to.equal(false);
    expect(canManageTrades("VIEWER")).to.equal(false);
  });

  it("grants trade creation to owners, admins, and traders", function () {
    expect(hasCapability("OWNER", "trade.create")).to.equal(true);
    expect(hasCapability("ADMIN", "trade.create")).to.equal(true);
    expect(hasCapability("TRADER", "trade.create")).to.equal(true);
    expect(hasCapability("SIGNER", "trade.create")).to.equal(false);
    expect(hasCapability("VIEWER", "trade.create")).to.equal(false);
  });

  it("requires a signing capability to approve a trade as buyer", function () {
    expect(hasCapability("OWNER", "trade.sign")).to.equal(true);
    expect(hasCapability("ADMIN", "trade.sign")).to.equal(true);
    expect(hasCapability("SIGNER", "trade.sign")).to.equal(true);
    expect(hasCapability("TRADER", "trade.sign")).to.equal(false);
    expect(hasCapability("VIEWER", "trade.sign")).to.equal(false);
  });

  it("reserves milestone management to traders and above", function () {
    expect(hasCapability("TRADER", "milestone.manage")).to.equal(true);
    expect(hasCapability("ADMIN", "milestone.manage")).to.equal(true);
    expect(hasCapability("SIGNER", "milestone.manage")).to.equal(false);
    expect(hasCapability("ACCOUNTANT", "milestone.manage")).to.equal(false);
  });

  it("allows accountants to approve settlements but not manage milestones", function () {
    expect(hasCapability("ACCOUNTANT", "settlement.approve")).to.equal(true);
    expect(hasCapability("ACCOUNTANT", "milestone.manage")).to.equal(false);
    expect(hasCapability("ACCOUNTANT", "member.manage")).to.equal(false);
  });

  it("keeps viewers read-only", function () {
    for (const capability of [
      "trade.create",
      "trade.sign",
      "milestone.manage",
      "settlement.approve",
      "evidence.submit",
      "member.manage",
    ] as const) {
      expect(hasCapability("VIEWER", capability)).to.equal(false);
    }
  });
});

describe("fine-grained capability overrides", function () {
  it("grants capabilities beyond the role defaults", function () {
    const viewer = effectiveCapabilities({
      role: "VIEWER",
      grantedCapabilities: ["trade.sign"],
      revokedCapabilities: [],
    });
    expect(viewer).to.include("trade.sign");
    expect(hasEffectiveCapability(
      { role: "VIEWER", grantedCapabilities: ["trade.sign"], revokedCapabilities: [] },
      "trade.sign"
    )).to.equal(true);
    // granted does not add other role capabilities
    expect(viewer).not.to.include("member.manage");
  });

  it("revokes a role-default capability", function () {
    expect(hasEffectiveCapability(
      { role: "ADMIN", grantedCapabilities: [], revokedCapabilities: ["member.manage"] },
      "member.manage"
    )).to.equal(false);
    expect(hasEffectiveCapability(
      { role: "ADMIN", grantedCapabilities: [], revokedCapabilities: ["member.manage"] },
      "trade.create"
    )).to.equal(true);
  });

  it("ignores unknown capabilities in overrides", function () {
    const capped = effectiveCapabilities({
      role: "VIEWER",
      grantedCapabilities: ["trade.sign", "not.a.capability"],
      revokedCapabilities: ["also.invalid"],
    });
    expect(capped).to.deep.equal(["trade.sign"]);
  });

  it("validates capability names", function () {
    expect(isCapability("trade.sign")).to.equal(true);
    expect(isCapability("admin.*")).to.equal(false);
  });

  it("rejects unknown, duplicated, or overlapping override lists", function () {
    const lists = [undefined, [], ["member.manage", "trade.create"], ["trade.create"]];
    expect(resolveCapabilityOverrides({ grant: undefined, revoke: undefined }).ok).to.equal(true);
    expect(resolveCapabilityOverrides({ grant: lists[0], revoke: undefined }).ok).to.equal(true);
    const unknown = resolveCapabilityOverrides({ grant: ["trade.bogus"], revoke: undefined });
    expect(unknown.ok).to.equal(false);
    const dup = resolveCapabilityOverrides({ revoke: ["trade.sign", "trade.sign"] });
    expect(dup.ok).to.equal(false);
    const overlap = resolveCapabilityOverrides({ grant: ["trade.sign"], revoke: ["trade.sign"] });
    expect(overlap.ok).to.equal(false);
  });
});

describe("organization invitation resolution", function () {
  const invited = { membershipStatus: "INVITED", actorIsInvitee: true, actorIsManager: false } as const;

  it("allows an invitee to accept a pending invitation", function () {
    const result = resolveInvitationAction({ ...invited, action: "accept" });
    expect(result).to.deep.equal({ ok: true, nextStatus: "ACTIVE" });
  });

  it("allows an invitee to reject a pending invitation", function () {
    const result = resolveInvitationAction({ ...invited, action: "reject" });
    expect(result).to.deep.equal({ ok: true, nextStatus: "REVOKED" });
  });

  it("does not let a non-invitee accept or reject", function () {
    const result = resolveInvitationAction({ ...invited, actorIsInvitee: false, action: "accept" });
    expect(result).to.deep.equal({ ok: false, status: 403, error: "Only the invited wallet can accept or reject" });
  });

  it("lets an active member manager cancel a pending invitation", function () {
    const result = resolveInvitationAction({
      membershipStatus: "INVITED",
      action: "cancel",
      actorIsInvitee: false,
      actorIsManager: true,
    });
    expect(result).to.deep.equal({ ok: true, nextStatus: "REVOKED" });
  });

  it("rejects cancellation from a wallet without member.manage", function () {
    const result = resolveInvitationAction({
      membershipStatus: "INVITED",
      action: "cancel",
      actorIsInvitee: false,
      actorIsManager: false,
    });
    expect(result).to.deep.equal({ ok: false, status: 403, error: "Organization owner or admin required" });
  });

  it("refuses to resolve a non-pending membership", function () {
    for (const action of ["accept", "reject", "cancel"] as const) {
      const result = resolveInvitationAction({
        membershipStatus: "ACTIVE",
        action,
        actorIsInvitee: true,
        actorIsManager: true,
      });
      expect(result, action).to.deep.equal({ ok: false, status: 409, error: "Only pending invitations can be resolved" });
    }
  });
});
