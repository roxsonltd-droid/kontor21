-- AlterTable: add V4 milestone-bound settlement proposal columns

ALTER TABLE "MilestoneSettlement" ADD COLUMN "proposalId" INTEGER;

ALTER TABLE "MilestoneSettlement" ADD COLUMN "milestoneHash" TEXT;

-- Unique constraint on proposalId (nullable, so multiple NULLs are allowed)
CREATE UNIQUE INDEX "MilestoneSettlement_proposalId_key" ON "MilestoneSettlement"("proposalId");

-- Index for milestoneHash lookups during chain event binding
CREATE INDEX "MilestoneSettlement_milestoneHash_idx" ON "MilestoneSettlement"("milestoneHash");
