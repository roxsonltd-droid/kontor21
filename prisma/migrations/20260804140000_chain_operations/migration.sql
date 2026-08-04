CREATE TYPE "ChainEventProcessingStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
CREATE TYPE "ReconciliationIssueStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

CREATE TABLE "ChainCursor" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "lastProcessedBlock" BIGINT NOT NULL,
    "confirmations" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChainCursor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChainEvent" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "ChainEventProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChainEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeadLetterEvent" (
    "id" TEXT NOT NULL,
    "chainEventId" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT NOT NULL,
    "nextRetryAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeadLetterEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReconciliationIssue" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tradeId" TEXT,
    "blockchainTradeId" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "databaseValue" TEXT,
    "chainValue" TEXT NOT NULL,
    "status" "ReconciliationIssueStatus" NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "details" JSONB,
    CONSTRAINT "ReconciliationIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChainCursor_network_contractAddress_key" ON "ChainCursor"("network", "contractAddress");
CREATE UNIQUE INDEX "ChainEvent_network_contractAddress_transactionHash_logIndex_key" ON "ChainEvent"("network", "contractAddress", "transactionHash", "logIndex");
CREATE INDEX "ChainEvent_network_contractAddress_blockNumber_idx" ON "ChainEvent"("network", "contractAddress", "blockNumber");
CREATE INDEX "ChainEvent_status_createdAt_idx" ON "ChainEvent"("status", "createdAt");
CREATE UNIQUE INDEX "DeadLetterEvent_chainEventId_key" ON "DeadLetterEvent"("chainEventId");
CREATE INDEX "DeadLetterEvent_resolvedAt_nextRetryAt_idx" ON "DeadLetterEvent"("resolvedAt", "nextRetryAt");
CREATE INDEX "ReconciliationIssue_status_detectedAt_idx" ON "ReconciliationIssue"("status", "detectedAt");
CREATE INDEX "ReconciliationIssue_blockchainTradeId_status_idx" ON "ReconciliationIssue"("blockchainTradeId", "status");
CREATE UNIQUE INDEX "RateLimitBucket_key_windowStart_key" ON "RateLimitBucket"("key", "windowStart");
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

ALTER TABLE "DeadLetterEvent" ADD CONSTRAINT "DeadLetterEvent_chainEventId_fkey" FOREIGN KEY ("chainEventId") REFERENCES "ChainEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
