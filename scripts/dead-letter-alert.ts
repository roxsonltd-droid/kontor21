import prisma from "../lib/prisma";
import { operationalLog } from "../lib/logger";

// Operational alerting for dead-letter queue health.
// Exits non-zero when unresolved dead letters are stale beyond the thresholds,
// so it can be wired to CI/cron alerting (e.g. Render cron or GitHub Actions).

const STALE_UNRESOLVED_MS = Number(process.env.DLQ_ALERT_UNRESOLVED_MS || 30 * 60 * 1000);
const MAX_RETRIES = Number(process.env.DLQ_ALERT_MAX_RETRIES || 5);

async function main() {
  const staleThreshold = new Date(Date.now() - STALE_UNRESOLVED_MS);

  const stale = await prisma.deadLetterEvent.findMany({
    where: {
      resolvedAt: null,
      nextRetryAt: null,
      createdAt: { lt: staleThreshold },
    },
    include: { chainEvent: { select: { transactionHash: true, logIndex: true, eventName: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const overRetries = await prisma.deadLetterEvent.findMany({
    where: {
      resolvedAt: null,
      retryCount: { gte: MAX_RETRIES },
    },
    include: { chainEvent: { select: { transactionHash: true, logIndex: true, eventName: true } } },
    orderBy: { retryCount: "desc" },
    take: 100,
  });

  const staleCount = stale.length;
  const retryCount = overRetries.length;

  if (staleCount === 0 && retryCount === 0) {
    operationalLog("info", "dead_letter_alert_ok", {
      staleThreshold: staleThreshold.toISOString(),
      maxRetries: MAX_RETRIES,
    });
    return;
  }

  const summary = {
    staleUnresolved: staleCount,
    overMaxRetries: retryCount,
    staleEvents: stale.map((d) => `${d.chainEvent.transactionHash}#${d.chainEvent.logIndex}`),
    retryExceeded: overRetries.map((d) => `${d.chainEvent.transactionHash}#${d.chainEvent.logIndex}`),
  };
  operationalLog("error", "dead_letter_alert", summary);
  process.exitCode = 1;
}

main().catch((error) => {
  operationalLog("error", "dead_letter_alert_failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
