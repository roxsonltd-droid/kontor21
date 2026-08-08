-- AlterTable: fine-grained capability overrides per membership.
ALTER TABLE "OrganizationMembership" ADD COLUMN     "grantedCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "revokedCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];