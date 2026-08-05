import { expect } from "chai";
import {
  canManageMembers,
  canManageTrades,
  hasCapability,
  normalizeOrganizationSlug,
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
