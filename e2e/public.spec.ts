import { test, expect } from "@playwright/test";

// Smoke tests for public pages that do not require a backend or wallet.
test.describe("public pages", () => {
  test("landing page renders the hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Kontor/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("demo workflow is interactive", async ({ page }) => {
    await page.goto("/demo");
    const nextStage = page.getByRole("button", { name: /Next stage/i });
    await expect(nextStage).toBeVisible();
    await expect(page.getByRole("button", { name: /2\./ })).toBeVisible();
    await nextStage.click();
    // Advancing changes which stage is highlighted.
    await expect(page.getByRole("button", { name: /3\./ })).toBeVisible();
    await expect(nextStage).toBeEnabled();
  });

  test("trust center lists the escrow contract address", async ({ page }) => {
    await page.goto("/trust");
    await expect(page.getByText(/Smart Contract Escrow/)).toBeVisible();
    await expect(page.locator("text=/0x[0-9a-fA-F]+/")).toBeVisible();
  });
});
