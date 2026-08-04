CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'TRADER', 'ACCOUNTANT', 'SIGNER', 'VIEWER');
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED');
CREATE TYPE "MilestoneStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EVIDENCE_PENDING', 'READY_FOR_RELEASE', 'PARTIALLY_RELEASED', 'RELEASED', 'DISPUTED', 'CANCELLED');
CREATE TYPE "MilestoneSettlementStatus" AS ENUM ('PENDING', 'PROPOSED', 'APPROVED', 'EXECUTED', 'REFUNDED', 'FAILED');

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vatNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TradeMilestone" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amountUsdc" DECIMAL(20,6) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'DRAFT',
    "evidenceDueAt" TIMESTAMP(3),
    "acceptanceDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TradeMilestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MilestoneSettlement" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "amountUsdc" DECIMAL(20,6) NOT NULL,
    "status" "MilestoneSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "evidenceRoot" TEXT,
    "transactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MilestoneSettlement_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TradeMetadata" ADD COLUMN "buyerOrganizationId" TEXT;
ALTER TABLE "TradeMetadata" ADD COLUMN "sellerOrganizationId" TEXT;
ALTER TABLE "TradeCondition" ADD COLUMN "milestoneId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "milestoneId" TEXT;

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Organization_vatNumber_key" ON "Organization"("vatNumber");
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");
CREATE INDEX "OrganizationMembership_userId_status_idx" ON "OrganizationMembership"("userId", "status");
CREATE INDEX "OrganizationMembership_organizationId_role_status_idx" ON "OrganizationMembership"("organizationId", "role", "status");
CREATE UNIQUE INDEX "TradeMilestone_tradeId_sequence_key" ON "TradeMilestone"("tradeId", "sequence");
CREATE INDEX "TradeMilestone_tradeId_status_idx" ON "TradeMilestone"("tradeId", "status");
CREATE UNIQUE INDEX "MilestoneSettlement_transactionHash_key" ON "MilestoneSettlement"("transactionHash");
CREATE INDEX "MilestoneSettlement_milestoneId_status_idx" ON "MilestoneSettlement"("milestoneId", "status");
CREATE INDEX "TradeMetadata_buyerOrganizationId_idx" ON "TradeMetadata"("buyerOrganizationId");
CREATE INDEX "TradeMetadata_sellerOrganizationId_idx" ON "TradeMetadata"("sellerOrganizationId");
CREATE INDEX "TradeCondition_milestoneId_idx" ON "TradeCondition"("milestoneId");
CREATE INDEX "Evidence_milestoneId_idx" ON "Evidence"("milestoneId");

ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TradeMetadata" ADD CONSTRAINT "TradeMetadata_buyerOrganizationId_fkey" FOREIGN KEY ("buyerOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TradeMetadata" ADD CONSTRAINT "TradeMetadata_sellerOrganizationId_fkey" FOREIGN KEY ("sellerOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TradeMilestone" ADD CONSTRAINT "TradeMilestone_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "TradeMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MilestoneSettlement" ADD CONSTRAINT "MilestoneSettlement_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "TradeMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TradeCondition" ADD CONSTRAINT "TradeCondition_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "TradeMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "TradeMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
