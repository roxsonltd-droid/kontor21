-- AlterTable: widen proposalId to BIGINT (int64) to match Solidity uint256 more closely

ALTER TABLE "MilestoneSettlement"
  ALTER COLUMN "proposalId" TYPE BIGINT USING "proposalId"::bigint;
