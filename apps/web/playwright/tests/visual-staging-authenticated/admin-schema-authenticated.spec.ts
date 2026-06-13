// workflow: issue-1127-authenticated-staging-visual-admin-screens-expansion
// Authenticated /admin/schema staging visual baseline (read-only initial render).
// Read-only: never submits alias assignment, bulk resolve, rollback, bulk rollback, or resync actions.

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11Dir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/issue-1127-authenticated-staging-visual-admin-screens-expansion/outputs/phase-11",
);

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test("staging /admin/schema authenticated read-only baseline", async ({ page }) => {
  await page.goto("/admin/schema", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "フォーム項目の対応づけ" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('[data-page="admin-schema"]')).toBeVisible();
  await expect(page.getByTestId("bulk-resolve-modal")).toHaveCount(0);
  await expect(page.getByTestId("bulk-rollback-modal")).toHaveCount(0);
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-schema-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-schema-authenticated.png"),
    fullPage: true,
    animations: "disabled",
  });
});
