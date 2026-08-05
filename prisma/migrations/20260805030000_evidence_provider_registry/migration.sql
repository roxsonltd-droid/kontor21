-- CreateTable: accredited evidence provider registry

CREATE TYPE "EvidenceProviderStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TABLE "EvidenceProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organizationId" TEXT,
    "accreditationNo" TEXT,
    "issuer" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "jurisdiction" TEXT,
    "status" "EvidenceProviderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EvidenceProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvidenceProviderWallet" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceProviderWallet_pkey" PRIMARY KEY ("id")
);

-- AlterTable: link evidence to a registered provider (legacy rows keep providerWallet only)

ALTER TABLE "Evidence" ADD COLUMN "providerId" TEXT;

-- CreateIndex: EvidenceProvider

CREATE UNIQUE INDEX "EvidenceProvider_slug_key" ON "EvidenceProvider"("slug");

CREATE INDEX "EvidenceProvider_organizationId_idx" ON "EvidenceProvider"("organizationId");

CREATE INDEX "EvidenceProvider_status_idx" ON "EvidenceProvider"("status");

CREATE INDEX "EvidenceProvider_issuer_idx" ON "EvidenceProvider"("issuer");

-- CreateIndex: EvidenceProviderWallet

CREATE UNIQUE INDEX "EvidenceProviderWallet_walletAddress_key" ON "EvidenceProviderWallet"("walletAddress");

CREATE INDEX "EvidenceProviderWallet_providerId_idx" ON "EvidenceProviderWallet"("providerId");

-- CreateIndex: Evidence

CREATE INDEX "Evidence_providerId_idx" ON "Evidence"("providerId");

-- AddForeignKey: EvidenceProvider.organizationId -> Organization.id

ALTER TABLE "EvidenceProvider" ADD CONSTRAINT "EvidenceProvider_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: EvidenceProviderWallet.providerId -> EvidenceProvider.id

ALTER TABLE "EvidenceProviderWallet" ADD CONSTRAINT "EvidenceProviderWallet_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "EvidenceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Evidence.providerId -> EvidenceProvider.id

ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "EvidenceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
