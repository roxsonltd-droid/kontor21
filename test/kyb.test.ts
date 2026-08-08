import { expect } from "chai";
import { resolveKybChange } from "../lib/kyb.ts";

describe("organization KYB state machine", function () {
  describe("submit", function () {
    it("moves UNVERIFIED to PENDING by an owner/admin", function () {
      const result = resolveKybChange({ current: "UNVERIFIED", action: "submit", actorIsManager: true, actorIsReviewer: false });
      expect(result).to.deep.equal({ ok: true, nextStatus: "PENDING" });
    });

    it("allows resubmission after a REJECTED submission", function () {
      const result = resolveKybChange({ current: "REJECTED", action: "submit", actorIsManager: true, actorIsReviewer: false });
      expect(result).to.deep.equal({ ok: true, nextStatus: "PENDING" });
    });

    it("rejects non-managers", function () {
      const result = resolveKybChange({ current: "UNVERIFIED", action: "submit", actorIsManager: false, actorIsReviewer: false });
      expect(result).to.deep.equal({ ok: false, status: 403, error: "Organization owner or admin required" });
    });

    it("blocks resubmission while PENDING or VERIFIED", function () {
      expect(resolveKybChange({ current: "PENDING", action: "submit", actorIsManager: true, actorIsReviewer: false }).ok).to.equal(false);
      expect(resolveKybChange({ current: "VERIFIED", action: "submit", actorIsManager: true, actorIsReviewer: false }).ok).to.equal(false);
    });
  });

  describe("approve", function () {
    it("verifies only a PENDING submission by a reviewer", function () {
      const result = resolveKybChange({ current: "PENDING", action: "approve", actorIsManager: false, actorIsReviewer: true });
      expect(result).to.deep.equal({ ok: true, nextStatus: "VERIFIED" });
    });

    it("requires a platform reviewer", function () {
      const result = resolveKybChange({ current: "PENDING", action: "approve", actorIsManager: true, actorIsReviewer: false });
      expect(result).to.deep.equal({ ok: false, status: 403, error: "Platform reviewer permission required" });
    });

    it("blocks approval of UNVERIFIED or REJECTED organizations", function () {
      expect(resolveKybChange({ current: "UNVERIFIED", action: "approve", actorIsManager: false, actorIsReviewer: true }).ok).to.equal(false);
      expect(resolveKybChange({ current: "REJECTED", action: "approve", actorIsManager: false, actorIsReviewer: true }).ok).to.equal(false);
    });
  });

  describe("reject", function () {
    it("rejects only a PENDING submission with a reason", function () {
      const result = resolveKybChange({ current: "PENDING", action: "reject", actorIsManager: false, actorIsReviewer: true, reason: "Documents expired" });
      expect(result).to.deep.equal({ ok: true, nextStatus: "REJECTED" });
    });

    it("requires a non-empty reason", function () {
      const result = resolveKybChange({ current: "PENDING", action: "reject", actorIsManager: false, actorIsReviewer: true, reason: "  " });
      expect(result).to.deep.equal({ ok: false, status: 400, error: "A rejection reason is required" });
      const noReason = resolveKybChange({ current: "PENDING", action: "reject", actorIsManager: false, actorIsReviewer: true });
      expect(noReason).to.deep.equal({ ok: false, status: 400, error: "A rejection reason is required" });
    });

    it("requires a reviewer", function () {
      const result = resolveKybChange({ current: "PENDING", action: "reject", actorIsManager: true, actorIsReviewer: false, reason: "why" });
      expect(result).to.deep.equal({ ok: false, status: 403, error: "Platform reviewer permission required" });
    });
  });

  it("rejects an unknown action", function () {
    const result = resolveKybChange({ current: "UNVERIFIED", action: "None", actorIsManager: true, actorIsReviewer: false });
    expect(result).to.deep.equal({ ok: false, status: 400, error: "Unknown KYB action" });
  });
});