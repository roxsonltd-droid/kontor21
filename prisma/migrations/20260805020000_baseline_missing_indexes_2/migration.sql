-- Baseline fix (2/2): remaining indexes from the baselined initial migration

CREATE INDEX "TradeCondition_tradeId_idx" ON "TradeCondition"("tradeId");

CREATE INDEX "Evidence_tradeId_idx" ON "Evidence"("tradeId");

CREATE INDEX "Evidence_conditionId_idx" ON "Evidence"("conditionId");

CREATE INDEX "AuditLog_tradeId_idx" ON "AuditLog"("tradeId");
