import { createHash } from "crypto";
import prisma from "@/lib/prisma";

export async function consumeRateLimit(
  identity: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs * 2);
  const key = createHash("sha256").update(identity).digest("hex");

  const [, bucket] = await prisma.$transaction([
    prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date(now) } } }),
    prisma.rateLimitBucket.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1, expiresAt },
      update: { count: { increment: 1 } },
    }),
  ]);

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((windowStart.getTime() + windowMs - now) / 1000)
    ),
  };
}

export function requestClientIdentity(headers: Headers) {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
