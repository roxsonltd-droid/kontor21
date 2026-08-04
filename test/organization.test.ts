import { expect } from "chai";
import {
  canManageMembers,
  canManageTrades,
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
});
