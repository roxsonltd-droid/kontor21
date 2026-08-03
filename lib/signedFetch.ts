"use client";

import { BrowserProvider } from "ethers";
import { buildAuthMessage } from "@/lib/auth-message";

export async function signedFetch(input: string, init: RequestInit = {}) {
  if (!window.ethereum) {
    throw new Error("A connected Web3 wallet is required");
  }

  const method = (init.method || "GET").toUpperCase();
  const body = typeof init.body === "string" ? init.body : "";
  const pathname = new URL(input, window.location.origin).pathname;
  const timestamp = Date.now().toString();
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const signature = await signer.signMessage(buildAuthMessage(method, pathname, timestamp, body));
  const headers = new Headers(init.headers);

  headers.set("x-wallet-address", address);
  headers.set("x-wallet-timestamp", timestamp);
  headers.set("x-wallet-signature", signature);
  if (body && !headers.has("content-type")) headers.set("content-type", "application/json");

  return fetch(input, { ...init, method, body: init.body, headers });
}
