// workflow: issue-901 / Phase 5 §5 / T-07
// Authenticated /admin staging visual baseline. Uses storageState minted by
// setup.staging-auth.ts (admin role / isAdmin claim true).

import { join } from "node:path";
import { expect, test } from "@playwright/test";

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

test("staging admin dashboard (authenticated admin) baseline", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/admin(\?|$)/);
  await expect(page.getByTestId("admin-dashboard-root")).toBeVisible({ timeout: 10_000 });
  await page.addStyleTag({
    content:
      "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
  });
  await expect(page).toHaveScreenshot("admin-dashboard-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
});
