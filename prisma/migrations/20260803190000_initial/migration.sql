CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "companyName" TEXT,
    "vatNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TRADER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TradeMetadata" (
    "id" TEXT NOT NULL,
    "blockchainTradeId" INTEGER,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(20,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "priceUsdc" DECIMAL(20,6) NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "oracleId" TEXT,
    "operationalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "settlementStatus" TEXT NOT NULL DEFAULT 'AWAITING_FUNDS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TradeMetadata_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TradeCondition" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "providerRole" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "TradeCondition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "conditionId" TEXT,
    "documentHash" TEXT NOT NULL,
    "providerWallet" TEXT NOT NULL,
    "verifiedValue" TEXT,
    "isValid" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorWallet" TEXT NOT NULL,
    "documentIpfsHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "TradeMetadata_blockchainTradeId_key" ON "TradeMetadata"("blockchainTradeId");
CREATE INDEX "TradeMetadata_buyerId_idx" ON "TradeMetadata"("buyerId");
CREATE INDEX "TradeMetadata_sellerId_idx" ON "TradeMetadata"("sellerId");
CREATE INDEX "TradeMetadata_oracleId_idx" ON "TradeMetadata"("oracleId");
CREATE INDEX "TradeCondition_tradeId_idx" ON "TradeCondition"("tradeId");
CREATE INDEX "Evidence_tradeId_idx" ON "Evidence"("tradeId");
CREATE INDEX "Evidence_conditionId_idx" ON "Evidence"("conditionId");
CREATE INDEX "AuditLog_tradeId_idx" ON "AuditLog"("tradeId");

ALTER TABLE "TradeMetadata" ADD CONSTRAINT "TradeMetadata_buyerId_fkey"
    FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TradeMetadata" ADD CONSTRAINT "TradeMetadata_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TradeMetadata" ADD CONSTRAINT "TradeMetadata_oracleId_fkey"
    FOREIGN KEY ("oracleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TradeCondition" ADD CONSTRAINT "TradeCondition_tradeId_fkey"
    FOREIGN KEY ("tradeId") REFERENCES "TradeMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_tradeId_fkey"
    FOREIGN KEY ("tradeId") REFERENCES "TradeMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_conditionId_fkey"
    FOREIGN KEY ("conditionId") REFERENCES "TradeCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tradeId_fkey"
    FOREIGN KEY ("tradeId") REFERENCES "TradeMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;
