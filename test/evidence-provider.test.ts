import { expect } from "chai";
import {
  cascadeEvidenceStatus,
  effectiveStatusFor,
  isActiveProvider,
  revocationUpdate,
  type ProviderStatusRow,
} from "../lib/evidence-provider.ts";

const now = new Date("2026-08-05T12:00:00Z");
const past = new Date("2026-08-01T12:00:00Z");
const future = new Date("2026-09-01T12:00:00Z");

function row(partial: Partial<ProviderStatusRow>): ProviderStatusRow {
  return {
    status: "PENDING",
    validFrom: null,
    validUntil: null,
    revokedAt: null,
    ...partial,
  };
}

describe("evidence provider accreditation status", function () {
  describe("effectiveStatusFor", function () {
    it("derives EXPIRED when validUntil passed even if stored status is ACTIVE", function () {
      const result = effectiveStatusFor(row({ status: "ACTIVE", validFrom: past, validUntil: past }), now);
      expect(result).to.equal("EXPIRED");
    });

    it("derives PENDING before validFrom", function () {
      const result = effectiveStatusFor(row({ status: "ACTIVE", validFrom: future, validUntil: future }), now);
      expect(result).to.equal("PENDING");
    });

    it("keeps ACTIVE inside the validity window", function () {
      const result = effectiveStatusFor(row({ status: "ACTIVE", validFrom: past, validUntil: future }), now);
      expect(result).to.equal("ACTIVE");
    });

    it("never downgrades a REVOKED status", function () {
      const result = effectiveStatusFor(row({ status: "REVOKED", validFrom: past, validUntil: future }), now);
      expect(result).to.equal("REVOKED");
    });

    it("treats a stored EXPIRED as terminal", function () {
      const result = effectiveStatusFor(row({ status: "EXPIRED" }), now);
      expect(result).to.equal("EXPIRED");
    });
  });

  describe("isActiveProvider", function () {
    it("accepts ACTIVE providers inside the window", function () {
      expect(isActiveProvider(row({ status: "ACTIVE", validFrom: past, validUntil: future }))).to.equal(true);
    });

    it("rejects PENDING and REVOKED providers", function () {
      expect(isActiveProvider(row({ status: "PENDING" }))).to.equal(false);
      expect(isActiveProvider(row({ status: "REVOKED" }))).to.equal(false);
    });

    it("rejects expired accreditations even if status is stored ACTIVE", function () {
      expect(isActiveProvider(row({ status: "ACTIVE", validUntil: past }))).to.equal(false);
    });
  });

  describe("cascadeEvidenceStatus", function () {
    it("cascades REVOKED and EXPIRED", function () {
      expect(cascadeEvidenceStatus("REVOKED" as never)).to.equal("REVOKED");
      expect(cascadeEvidenceStatus("EXPIRED" as never)).to.equal("EXPIRED");
    });

    it("returns null for non-terminal statuses", function () {
      expect(cascadeEvidenceStatus("ACTIVE" as never)).to.equal(null);
      expect(cascadeEvidenceStatus("PENDING" as never)).to.equal(null);
    });
  });

  describe("revocationUpdate", function () {
    it("builds a normalized revoke payload with actor, reason, and timestamp", function () {
      const payload = revocationUpdate(row({ status: "ACTIVE" }), "0xA11ce", "Certificate forged", now);
      expect(payload).to.deep.equal({
        status: "REVOKED",
        revokedAt: now,
        revokedBy: "0xA11ce",
        revokedReason: "Certificate forged",
      });
    });

    it("refuses to revoke a provider that is already REVOKED", function () {
      expect(revocationUpdate(row({ status: "REVOKED", revokedAt: now }), "0xA11ce", "again", now)).to.equal(null);
    });

    it("refuses a revocation without a reason", function () {
      expect(revocationUpdate(row({ status: "ACTIVE" }), "0xA11ce", "", now)).to.equal(null);
      expect(revocationUpdate(row({ status: "ACTIVE" }), "0xA11ce", "   ", now)).to.equal(null);
      expect(revocationUpdate(row({ status: "ACTIVE" }), "0xA11ce", undefined, now)).to.equal(null);
    });

    it("preserves an existing revokedAt when re-revoking is blocked upstream", function () {
      const payload = revocationUpdate(row({ status: "ACTIVE", revokedAt: now }), "0xA11ce", "reason", new Date("2026-08-06"));
      expect(payload?.revokedAt).to.equal(now);
    });
  });
});
