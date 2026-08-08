-- AlterTable
CREATE TYPE "LedgerCategory" AS ENUM ('DEPOSIT', 'RELEASE', 'FEE', 'REFUND');

CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "chainEventId" TEXT NOT NULL,
    "category" "LedgerCategory" NOT NULL,
    "blockchainTradeId" INTEGER,
    "tradeId" TEXT,
    "amountMicros" BIGINT NOT NULL,
    "amountUsdc" DECIMAL(20,6) NOT NULL,
    "feeMicros" BIGINT NOT NULL DEFAULT 0,
    "feeBasisPoints" INTEGER,
    "from" TEXT,
    "to" TEXT,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LedgerEntry_chainEventId_key" ON "LedgerEntry"("chainEventId");
CREATE INDEX "LedgerEntry_tradeId_idx" ON "LedgerEntry"("tradeId");
CREATE INDEX "LedgerEntry_blockchainTradeId_idx" ON "LedgerEntry"("blockchainTradeId");
CREATE INDEX "LedgerEntry_network_blockNumber_idx" ON "LedgerEntry"("network", "blockNumber");