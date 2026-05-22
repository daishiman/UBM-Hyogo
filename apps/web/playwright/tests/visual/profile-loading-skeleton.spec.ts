import { expect, test } from "@playwright/test";
import path from "node:path";

const screenshotPath = path.resolve(
  process.cwd(),
  "../../docs/30-workflows/profile-loading-skeleton-oklch/outputs/phase-11/screenshots/profile-loading-skeleton.png",
);

test("profile loading skeleton visual evidence", async ({ page }) => {
  await page.goto("/visual-harness/profile-loading");
  await expect(page.locator('[data-page="profile-loading"]')).toBeVisible();
  await expect(page.locator('[data-skeleton="avatar"]')).toBeVisible();
  await expect(page.locator('[data-skeleton="profile-kv"] .h-6')).toHaveCount(4);

  await page.addStyleTag({
    content:
      "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;}[data-nextjs-dev-tools-button],nextjs-portal{display:none!important;}",
  });
  await page.screenshot({ path: screenshotPath, fullPage: true });
});
