// workflow: issue-901 / Phase 5 §5 / T-06
// Authenticated /profile staging visual baseline. Uses storageState minted by
// setup.staging-auth.ts (member role).

import { join } from "node:path";
import { expect, test } from "@playwright/test";

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "member.storageState.json"),
});

test("staging profile (authenticated member) baseline", async ({ page }) => {
  await page.goto("/profile", { waitUntil: "networkidle" });
  // guard へ redirect されていないこと（/login へ落ちると flake になるため明示 fail）
  await expect(page).toHaveURL(/\/profile(\?|$)/);
  await expect(page.getByTestId("profile-authenticated-root")).toBeVisible({ timeout: 10_000 });
  await page.addStyleTag({
    content:
      "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
  });
  await expect(page).toHaveScreenshot("profile-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
});
