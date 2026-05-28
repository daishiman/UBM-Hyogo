// workflow: admin-tag-queue-ui-and-404-recovery / task-C
// Authenticated /admin/tags staging visual baseline.
// Uses storageState minted by setup.staging-auth.ts (admin role).

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11Dir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/completed-tasks/admin-tag-queue-ui-and-404-recovery/outputs/phase-11",
);

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

const disableAnimations = `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`;

test("staging /admin/tags page-head + grid-2 layout baseline", async ({ page }) => {
  await page.goto("/admin/tags", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "タグキュー" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId("admin-tag-queue-list")).toBeVisible();
  await expect(page.getByTestId("admin-tag-review-panel")).toBeVisible();
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-tags-items.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-tags-items.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("staging /admin/tags empty state when no items match filter", async ({ page }) => {
  await page.goto("/admin/tags?status=rejected", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "タグキュー" })).toBeVisible({
    timeout: 10_000,
  });
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-tags-empty.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-tags-empty.png"),
    fullPage: true,
    animations: "disabled",
  });
});
