import prisma from "./prisma";
import { normalizeOrganizationSlug } from "./organization";

/**
 * Backfills a default OWNER organization for a user that carries legacy
 * company fields but has no organization yet. Returns the organization id when
 * one exists or was created, otherwise null.
 */
export async function ensureOwnedOrganizationForUser(
  userId: string,
  companyName: string | null | undefined,
  vatNumber: string | null | undefined
) {
  const name = companyName?.trim();
  if (!name) return null;

  const existing = await prisma.organization.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    include: {
      memberships: {
        where: { userId, role: "OWNER", status: "ACTIVE" },
        take: 1,
      },
    },
  });
  if (existing) {
    if (existing.memberships.length === 0) {
      await prisma.organizationMembership.create({
        data: { organizationId: existing.id, userId, role: "OWNER", status: "ACTIVE" },
      });
    }
    return existing.id;
  }

  const baseSlug = normalizeOrganizationSlug(name) || "company";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const organization = await prisma.organization.create({
    data: {
      name,
      slug,
      vatNumber: vatNumber?.trim().toUpperCase() || null,
      memberships: { create: { userId, role: "OWNER", status: "ACTIVE" } },
    },
  });
  return organization.id;
}
