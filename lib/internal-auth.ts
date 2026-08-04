import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export function isAuthorizedInternalRequest(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}
