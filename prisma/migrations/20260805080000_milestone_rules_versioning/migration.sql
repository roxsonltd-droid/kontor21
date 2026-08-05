-- AlterTable
ALTER TABLE "TradeMilestone" ADD COLUMN     "rulesVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "MilestoneRules" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "changeNote" TEXT,
    "conditions" JSONB NOT NULL,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneRules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MilestoneRules_milestoneId_supersededAt_idx" ON "MilestoneRules"("milestoneId", "supersededAt");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneRules_milestoneId_version_key" ON "MilestoneRules"("milestoneId", "version");

-- AddForeignKey
ALTER TABLE "MilestoneRules" ADD CONSTRAINT "MilestoneRules_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "TradeMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

