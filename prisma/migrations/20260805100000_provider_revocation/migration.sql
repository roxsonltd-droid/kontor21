-- AlterTable
ALTER TABLE "EvidenceProvider" ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "revokedBy" TEXT,
ADD COLUMN "revokedReason" TEXT;
