-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "attestationSignature" TEXT,
ADD COLUMN     "attestedAt" TIMESTAMP(3);