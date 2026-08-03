CREATE TYPE "UserRole" AS ENUM ('TRADER', 'ORACLE', 'ADMIN', 'LAB', 'INSPECTOR');
CREATE TYPE "OperationalStatus" AS ENUM ('PENDING', 'SHIPPED', 'INSPECTED', 'CONDITIONS_SATISFIED', 'DISPUTED');
CREATE TYPE "SettlementStatus" AS ENUM ('AWAITING_FUNDS', 'FUNDED', 'RELEASED', 'REFUNDED', 'PARTIAL_SETTLEMENT', 'DISPUTED');
CREATE TYPE "ProviderRole" AS ENUM ('ORACLE', 'LAB', 'INSPECTOR', 'CARRIER');
CREATE TYPE "ConditionOperator" AS ENUM ('<=', '>=', '<', '>', '==');
CREATE TYPE "EvidenceValidationStatus" AS ENUM ('PENDING', 'VALID', 'INVALID', 'CONFLICTING', 'EXPIRED', 'REVOKED', 'MANUAL_REVIEW');

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole"),
  ALTER COLUMN "role" SET DEFAULT 'TRADER';

ALTER TABLE "TradeMetadata"
  ALTER COLUMN "operationalStatus" DROP DEFAULT,
  ALTER COLUMN "operationalStatus" TYPE "OperationalStatus" USING ("operationalStatus"::"OperationalStatus"),
  ALTER COLUMN "operationalStatus" SET DEFAULT 'PENDING',
  ALTER COLUMN "settlementStatus" DROP DEFAULT,
  ALTER COLUMN "settlementStatus" TYPE "SettlementStatus" USING ("settlementStatus"::"SettlementStatus"),
  ALTER COLUMN "settlementStatus" SET DEFAULT 'AWAITING_FUNDS';

ALTER TABLE "TradeCondition"
  ALTER COLUMN "operator" TYPE "ConditionOperator" USING ("operator"::"ConditionOperator"),
  ALTER COLUMN "providerRole" TYPE "ProviderRole" USING ("providerRole"::"ProviderRole");

ALTER TABLE "Evidence"
  ADD COLUMN "validationStatus" "EvidenceValidationStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "Evidence"
SET "validationStatus" = CASE
  WHEN "isValid" = true THEN 'VALID'::"EvidenceValidationStatus"
  WHEN "isValid" = false THEN 'INVALID'::"EvidenceValidationStatus"
  ELSE 'PENDING'::"EvidenceValidationStatus"
END;

ALTER TABLE "Evidence" DROP COLUMN "isValid";
