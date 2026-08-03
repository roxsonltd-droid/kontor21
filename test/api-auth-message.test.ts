import { expect } from "chai";
import { Wallet, verifyMessage } from "ethers";
import { buildAuthMessage } from "../lib/auth-message.ts";

describe("wallet API authentication message", function () {
  it("binds the signature to domain, chain, nonce, route, and body", async function () {
    const wallet = Wallet.createRandom();
    const message = buildAuthMessage(
      "PATCH",
      "/api/escrow/trade-1",
      "2026-08-03T22:30:00.000Z",
      '{"settlementStatus":"FUNDED"}',
      "single-use-nonce",
      "kontor21.onrender.com",
      80002
    );
    const signature = await wallet.signMessage(message);

    expect(verifyMessage(message, signature)).to.equal(wallet.address);
    expect(message).to.include("Domain: kontor21.onrender.com");
    expect(message).to.include("Chain ID: 80002");
    expect(message).to.include("Nonce: single-use-nonce");
    expect(message).to.include("Method: PATCH");
    expect(message).to.include("Path: /api/escrow/trade-1");
  });

  it("invalidates a signature when the nonce changes", async function () {
    const wallet = Wallet.createRandom();
    const original = buildAuthMessage(
      "POST",
      "/api/escrow",
      "2026-08-03T22:30:00.000Z",
      "{}",
      "nonce-a",
      "kontor21.onrender.com",
      80002
    );
    const replayTarget = original.replace("nonce-a", "nonce-b");
    const signature = await wallet.signMessage(original);

    expect(verifyMessage(replayTarget, signature)).to.not.equal(wallet.address);
  });
});
