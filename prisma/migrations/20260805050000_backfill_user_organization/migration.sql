-- Data migration: backfill Organization + OWNER membership from User company fields.
--
-- Legal identity lives on Organization, not User. For every User that has a
-- companyName and no matching Organization yet, create one (with the VAT number
-- when available) and appoint the User as OWNER. Idempotent: safe to re-run.

DO $$
DECLARE
  u RECORD;
  org_id TEXT;
  base_slug TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR u IN
    SELECT id, "companyName", "vatNumber"
    FROM "User"
    WHERE "companyName" IS NOT NULL
      AND btrim("companyName") <> ''
  LOOP
    -- Skip if the user already has a membership that owns an org with this name
    IF EXISTS (
      SELECT 1
      FROM "OrganizationMembership" om
      JOIN "Organization" o ON o.id = om."organizationId"
      WHERE om."userId" = u.id
        AND om.role = 'OWNER'
        AND lower(o.name) = lower(btrim(u."companyName"))
    ) THEN
      CONTINUE;
    END IF;

    org_id := NULL;
    SELECT o.id INTO org_id
    FROM "Organization" o
    WHERE lower(o.name) = lower(btrim(u."companyName"))
    ORDER BY o."createdAt"
    LIMIT 1;

    IF org_id IS NULL THEN
      base_slug := lower(regexp_replace(btrim(u."companyName"), '[^a-z0-9]+', '-', 'g'));
      base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
      base_slug := left(base_slug, 64);
      IF base_slug = '' THEN base_slug := 'company'; END IF;

      candidate := base_slug;
      suffix := 1;
      WHILE EXISTS (SELECT 1 FROM "Organization" WHERE "slug" = candidate) LOOP
        candidate := base_slug || '-' || suffix;
        suffix := suffix + 1;
      END LOOP;

      INSERT INTO "Organization" ("id", "name", "slug", "vatNumber", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, btrim(u."companyName"), candidate, u."vatNumber", now(), now())
      RETURNING "id" INTO org_id;
    END IF;

    INSERT INTO "OrganizationMembership"
      ("id", "organizationId", "userId", "role", "status", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid()::text, org_id, u.id, 'OWNER', 'ACTIVE', now(), now());
  END LOOP;
END $$;
