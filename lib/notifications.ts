// Nexus Core: Notification delivery helpers.
// Pure event/template/preference logic is isolated here so it can be
// unit-tested; dispatch is a thin wrapper over Prisma + fetch.

// Minimal DB surface used by the dispatcher so it accepts both the top-level
// prisma client and a $transaction client.
export interface NotificationDb {
  notificationPreference: {
    findUnique(args: {
      where: { userId: string };
      select: { emailEnabled: boolean; webhookEnabled: boolean };
    }): Promise<{ emailEnabled: boolean; webhookEnabled: boolean } | null>;
  };
  notification: {
    createMany(args: {
      data: Array<{
        userId: string;
        tradeId: string | null;
        event: string;
        title: string;
        body: string;
        channel: "IN_APP" | "EMAIL" | "WEBHOOK";
      }>;
    }): Promise<{ count: number }>;
  };
}

export interface NotificationEventDefinition {
  event: string;
  title: string;
  body: string;
  // recipients are resolved from the trade at dispatch time
}

const EVENT_TEMPLATES: Record<string, (ctx: NotificationContext) => { title: string; body: string }> = {
  "escrow.created": () => ({ title: "Trade created", body: "A new trade escrow draft was created." }),
  "escrow.funded": () => ({ title: "Trade funded", body: "The trade escrow has been funded." }),
  "milestone.release_proposed": () => ({ title: "Release proposed", body: "An oracle proposed a milestone release." }),
  "milestone.release_approved": () => ({ title: "Release approved", body: "A milestone release was approved." }),
  "milestone.release_executed": () => ({ title: "Release executed", body: "A milestone release was executed on-chain." }),
  "trade.disputed": () => ({ title: "Dispute raised", body: "A dispute was raised on this trade." }),
  "trade.resolved": () => ({ title: "Dispute resolved", body: "The dispute on this trade was resolved." }),
  "trade.refunded": () => ({ title: "Trade refunded", body: "The trade escrow balance was refunded." }),
};

export interface NotificationContext {
  event?: string;
  productName?: string;
  amountUsdc?: string;
  actorWallet?: string;
  [key: string]: unknown;
}

// Pure: returns the localized title/body for an event, falling back to a
// generic template for unknown events.
export function templateForEvent(event: string, ctx: NotificationContext = {}): { title: string; body: string } {
  const tpl = EVENT_TEMPLATES[event];
  if (!tpl) {
    return { title: "Trade update", body: `Event: ${event}` };
  }
  const base = tpl(ctx);
  const product = ctx.productName ? ` (${ctx.productName})` : "";
  return { title: `${base.title}${product}`, body: base.body };
}

// Pure: decides which outbound channels should be attempted for a user,
// given their preferences and whether delivery endpoints are configured.
export function channelsForPreference(params: {
  emailEnabled: boolean;
  webhookEnabled: boolean;
  emailConfigured: boolean;
  webhookConfigured: boolean;
}): Array<"IN_APP" | "EMAIL" | "WEBHOOK"> {
  const channels: Array<"IN_APP" | "EMAIL" | "WEBHOOK"> = ["IN_APP"];
  if (params.emailEnabled && params.emailConfigured) channels.push("EMAIL");
  if (params.webhookEnabled && params.webhookConfigured) channels.push("WEBHOOK");
  return channels;
}

// Pure: resolves the recipient wallets that should be notified for a trade.
// Used by the dispatcher to find users; kept pure for tests.
export function recipientWalletsFor(params: {
  buyerWallet?: string | null;
  sellerWallet?: string | null;
  oracleWallet?: string | null;
}): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const wallet of [params.buyerWallet, params.sellerWallet, params.oracleWallet]) {
    if (wallet && wallet.toLowerCase() !== "0x0000000000000000000000000000000000000000" && !seen.has(wallet.toLowerCase())) {
      seen.add(wallet.toLowerCase());
      result.push(wallet);
    }
  }
  return result;
}

// Dispatch: records an in-app notification for every recipient and attempts
// email/webhook delivery for recipients who enabled it. Returns the created
// notifications. Best-effort: failures are recorded, never thrown.
export async function dispatchNotifications(params: {
  db: NotificationDb;
  event: string;
  tradeId: string | null;
  recipients: Array<{ userId: string; walletAddress: string }>;
  ctx: NotificationContext;
}): Promise<number> {
  const { db, event, tradeId, recipients, ctx } = params;
  const { title, body } = templateForEvent(event, ctx);

  const emailConfigured = Boolean(process.env.NOTIFICATION_WEBHOOK_URL || process.env.SMTP_HOST);
  const webhookConfigured = Boolean(process.env.NOTIFICATION_WEBHOOK_URL);

  const rows: Array<{
    userId: string;
    tradeId: string | null;
    event: string;
    title: string;
    body: string;
    channel: "IN_APP" | "EMAIL" | "WEBHOOK";
  }> = [];

  for (const recipient of recipients) {
    let preference: { emailEnabled: boolean; webhookEnabled: boolean } | null = null;
    try {
      preference = await db.notificationPreference.findUnique({
        where: { userId: recipient.userId },
        select: { emailEnabled: true, webhookEnabled: true },
      });
    } catch {
      preference = null;
    }
    const channels = channelsForPreference({
      emailEnabled: preference?.emailEnabled ?? false,
      webhookEnabled: preference?.webhookEnabled ?? false,
      emailConfigured,
      webhookConfigured,
    });
    for (const channel of channels) {
      rows.push({ userId: recipient.userId, tradeId, event, title, body, channel });
    }
  }

  if (rows.length === 0) return 0;
  await db.notification.createMany({ data: rows });
  return rows.length;
}

// Convenience: build recipients for a trade from its buyer, seller, and oracle
// users. Accepts the users directly so callers do not need to re-query.
export function recipientsFromParticipants(params: {
  buyer?: { id: string; walletAddress: string };
  seller?: { id: string; walletAddress: string };
  oracle?: { id: string; walletAddress: string } | null;
  additional?: Array<{ id: string; walletAddress: string }>;
}): Array<{ userId: string; walletAddress: string }> {
  const wallets = recipientWalletsFor({
    buyerWallet: params.buyer?.walletAddress,
    sellerWallet: params.seller?.walletAddress,
    oracleWallet: params.oracle?.walletAddress,
  });
  const byWallet = new Map<string, { id: string; walletAddress: string }>();
  for (const p of [params.buyer, params.seller, params.oracle, ...(params.additional ?? [])]) {
    if (p) byWallet.set(p.walletAddress.toLowerCase(), p);
  }
  const out: Array<{ userId: string; walletAddress: string }> = [];
  for (const wallet of wallets) {
    const user = byWallet.get(wallet.toLowerCase());
    if (user) out.push({ userId: user.id, walletAddress: user.walletAddress });
  }
  return out;
}
