-- Baseline fix: indexes declared in schema but missing from the baselined DB

CREATE INDEX "TradeMetadata_buyerId_idx" ON "TradeMetadata"("buyerId");

CREATE INDEX "TradeMetadata_sellerId_idx" ON "TradeMetadata"("sellerId");

CREATE INDEX "TradeMetadata_oracleId_idx" ON "TradeMetadata"("oracleId");

CREATE INDEX "User_role_idx" ON "User"("role");
