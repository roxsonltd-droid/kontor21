-- CreateEnum
CREATE TYPE "KybStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "kybCountry" TEXT,
ADD COLUMN     "kybRejectedAt" TIMESTAMP(3),
ADD COLUMN     "kybRejectedBy" TEXT,
ADD COLUMN     "kybRejectionReason" TEXT,
ADD COLUMN     "kybStatus" "KybStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "kybVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "kybVerifiedBy" TEXT;