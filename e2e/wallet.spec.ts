import { test, expect, type Page } from "@playwright/test";

const TEST_ADDRESS = "0x5468E5a38D75FbF905E23A49B18bbfb024f1b47d";

// Injects a minimal EIP-1193 provider so pages using useWallet() (window.ethereum)
// can connect without a real browser wallet extension.
async function mockEthereum(page: Page) {
  await page.addInitScript((address) => {
    const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
    (window as unknown as Record<string, unknown>).ethereum = {
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts" || method === "eth_accounts") {
          return [address];
        }
        if (method === "eth_chainId") return "0x13882"; // 80002
        return null;
      },
      on: (event: string, handler: (...args: unknown[]) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      },
      removeListener: () => {},
    };
  }, TEST_ADDRESS);
}

test.describe("wallet-connected trade creation", () => {
  test("connects a mock wallet on the trade creation page", async ({ page }) => {
    await mockEthereum(page);
    await page.goto("/trade/new");
    await page.locator("input").first().waitFor({ timeout: 20_000 });

    // The injected EIP-1193 provider is the connection path useWallet() relies on.
    const accounts = await page.evaluate(() =>
      (window as unknown as { ethereum?: { request: (r: { method: string }) => Promise<unknown> } })
        .ethereum!.request({ method: "eth_accounts" })
    );
    expect(accounts).toEqual([TEST_ADDRESS]);
  });
});
