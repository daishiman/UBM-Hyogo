// workflow: issue-1127-authenticated-staging-visual-admin-screens-expansion
// Authenticated /admin/identity-conflicts staging visual baseline (read-only).
// Read-only: never clicks merge or dismissal controls. The confirm flow is never entered.

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

test("staging /admin/identity-conflicts authenticated read-only baseline", async ({ page }) => {
  await page.goto("/admin/identity-conflicts", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "会員の重複確認" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('section[data-route="admin"]')).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-identity-conflicts-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-identity-conflicts-authenticated.png"),
    fullPage: true,
    animations: "disabled",
  });
});
