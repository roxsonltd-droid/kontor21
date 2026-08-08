-- Drop the one-to-one chainEventId constraint: a single escrow ReleaseApproved
-- event produces two ledger rows (seller release + fee), so the index is a
-- regular non-unique one instead.
DROP INDEX "LedgerEntry_chainEventId_key";
CREATE INDEX "LedgerEntry_chainEventId_idx" ON "LedgerEntry"("chainEventId");