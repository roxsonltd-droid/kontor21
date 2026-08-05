-- AlterTable
ALTER TABLE "EvidenceProvider" ADD COLUMN     "issuerId" TEXT;

-- CreateTable
CREATE TABLE "AccreditationIssuer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "aliases" TEXT[],
    "country" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationIssuer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccreditationIssuer_slug_key" ON "AccreditationIssuer"("slug");

-- CreateIndex
CREATE INDEX "EvidenceProvider_issuerId_idx" ON "EvidenceProvider"("issuerId");

-- AddForeignKey
ALTER TABLE "EvidenceProvider" ADD CONSTRAINT "EvidenceProvider_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "AccreditationIssuer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
