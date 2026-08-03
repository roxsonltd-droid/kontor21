"use client";

import { BrowserProvider } from "ethers";
import { buildAuthMessage } from "@/lib/auth-message";

export async function signedFetch(input: string, init: RequestInit = {}) {
  if (!window.ethereum) {
    throw new Error("A connected Web3 wallet is required");
  }

  const method = (init.method || "GET").toUpperCase();
  let body = typeof init.body === "string" ? init.body : "";
  let contentSha256 = "";
  if (init.body instanceof FormData) {
    const file = init.body.get("file");
    if (file instanceof File) {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      contentSha256 = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      body = `sha256:${contentSha256}`;
    }
  }
  const requestUrl = new URL(input, window.location.origin);
  const pathname = `${requestUrl.pathname}${requestUrl.search}`;
  const timestamp = Date.now().toString();
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const nonceResponse = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const challenge = await nonceResponse.json() as {
    nonce?: string;
    chainId?: number;
    error?: string;
  };
  if (!nonceResponse.ok || !challenge.nonce || !challenge.chainId) {
    throw new Error(challenge.error || "Unable to create authentication challenge");
  }

  const walletChainId = Number(await window.ethereum.request({ method: "eth_chainId" }));
  if (walletChainId !== challenge.chainId) {
    throw new Error(`Switch wallet network to Polygon Amoy (${challenge.chainId})`);
  }
  const domain = window.location.host;
  const signature = await signer.signMessage(
    buildAuthMessage(method, pathname, timestamp, body, challenge.nonce, domain, challenge.chainId)
  );
  const headers = new Headers(init.headers);

  headers.set("x-wallet-address", address);
  headers.set("x-wallet-timestamp", timestamp);
  headers.set("x-wallet-signature", signature);
  headers.set("x-wallet-nonce", challenge.nonce);
  headers.set("x-wallet-domain", domain);
  headers.set("x-wallet-chain-id", challenge.chainId.toString());
  if (contentSha256) headers.set("x-content-sha256", contentSha256);
  if (body && !headers.has("content-type")) headers.set("content-type", "application/json");

  return fetch(input, { ...init, method, body: init.body, headers });
}
