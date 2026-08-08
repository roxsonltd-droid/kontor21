import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthorizedInternalRequest } from "@/lib/internal-auth";

export async function GET(req: NextRequest) {
  if (!isAuthorizedInternalRequest(req)) {
    return NextResponse.json({ error: "Internal authorization required" }, { status: 401 });
  }
  const [failedEvents, unresolvedDeadLetters, openIssues, cursors, ledgerEntries] = await Promise.all([
    prisma.chainEvent.count({ where: { status: "FAILED" } }),
    prisma.deadLetterEvent.count({ where: { resolvedAt: null } }),
    prisma.reconciliationIssue.count({ where: { status: "OPEN" } }),
    prisma.chainCursor.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.ledgerEntry.count(),
  ]);
  return NextResponse.json({
    failedEvents,
    unresolvedDeadLetters,
    openReconciliationIssues: openIssues,
    ledgerEntries,
    cursors: cursors.map((cursor) => ({
      ...cursor,
      lastProcessedBlock: cursor.lastProcessedBlock.toString(),
    })),
    timestamp: new Date().toISOString(),
  });
}
