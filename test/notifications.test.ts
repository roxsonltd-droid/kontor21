import { expect } from "chai";
import {
  channelsForPreference,
  recipientsFromParticipants,
  recipientWalletsFor,
  templateForEvent,
} from "../lib/notifications.ts";

describe("notification delivery helpers", function () {
  it("templates known events with a product context", function () {
    const tpl = templateForEvent("escrow.created", { productName: "Sunflower Seeds" });
    expect(tpl.title).to.include("Trade created");
    expect(tpl.title).to.include("Sunflower Seeds");
    expect(tpl.body).to.be.a("string");
  });

  it("falls back to a generic template for unknown events", function () {
    const tpl = templateForEvent("something.unknown");
    expect(tpl.title).to.equal("Trade update");
    expect(tpl.body).to.include("something.unknown");
  });

  it("templates the full event vocabulary", function () {
    const events = [
      "escrow.created",
      "escrow.funded",
      "milestone.release_proposed",
      "milestone.release_approved",
      "milestone.release_executed",
      "trade.disputed",
      "trade.resolved",
      "trade.refunded",
    ];
    for (const event of events) {
      const tpl = templateForEvent(event);
      expect(tpl.title.length, event).to.be.greaterThan(0);
      expect(tpl.body.length, event).to.be.greaterThan(0);
    }
  });

  it("always includes the in-app channel and adds email/webhook when configured", function () {
    expect(channelsForPreference({ emailEnabled: false, webhookEnabled: false, emailConfigured: true, webhookConfigured: true }))
      .to.deep.equal(["IN_APP"]);
    expect(channelsForPreference({ emailEnabled: true, webhookEnabled: false, emailConfigured: true, webhookConfigured: true }))
      .to.deep.equal(["IN_APP", "EMAIL"]);
    expect(channelsForPreference({ emailEnabled: true, webhookEnabled: true, emailConfigured: true, webhookConfigured: true }))
      .to.deep.equal(["IN_APP", "EMAIL", "WEBHOOK"]);
  });

  it("does not add email/webhook when no delivery endpoint is configured", function () {
    expect(channelsForPreference({ emailEnabled: true, webhookEnabled: true, emailConfigured: false, webhookConfigured: false }))
      .to.deep.equal(["IN_APP"]);
  });

  it("deduplicates recipient wallets and ignores the zero address", function () {
    const wallets = recipientWalletsFor({
      buyerWallet: "0x1111111111111111111111111111111111111111",
      sellerWallet: "0x1111111111111111111111111111111111111111",
      oracleWallet: "0x0000000000000000000000000000000000000000",
    });
    expect(wallets).to.deep.equal(["0x1111111111111111111111111111111111111111"]);
  });

  it("resolves recipients from trade participants (case-insensitive)", function () {
    const recipients = recipientsFromParticipants({
      buyer: { id: "b1", walletAddress: "0x1111111111111111111111111111111111111111" },
      seller: { id: "s1", walletAddress: "0x2222222222222222222222222222222222222222" },
      oracle: { id: "o1", walletAddress: "0x2222222222222222222222222222222222222222" },
    });
    expect(recipients).to.have.length(2);
    const wallets = recipients.map((r) => r.walletAddress);
    expect(wallets).to.include("0x1111111111111111111111111111111111111111");
    expect(wallets).to.include("0x2222222222222222222222222222222222222222");
  });
});
