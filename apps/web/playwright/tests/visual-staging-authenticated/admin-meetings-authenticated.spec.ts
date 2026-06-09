// workflow: issue-1127-authenticated-staging-visual-admin-screens-expansion
// Authenticated /admin/meetings staging visual baseline (read-only initial render).
// Read-only: never submits meeting changes, opens the attendance drawer, or triggers attendance mutations.

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

test("staging /admin/meetings authenticated read-only baseline", async ({ page }) => {
  await page.goto("/admin/meetings", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "開催日 / 出席管理" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('[aria-label="開催 KPI"]')).toBeVisible();
  await expect(page.getByTestId("attendance-toast")).toHaveCount(0);
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-meetings-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-meetings-authenticated.png"),
    fullPage: true,
    animations: "disabled",
  });
});
