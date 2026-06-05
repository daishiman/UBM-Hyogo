// workflow: issue-1077 / authenticated staging bulk tag picker visual baseline.
// Read-only capture: selects members and toggles picker mode, but never applies tags.

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11ScreenshotsDir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-11/screenshots",
);

const SNAP = {
  assign: "bulk-tag-picker-assign-mode.png",
  unassign: "bulk-tag-picker-unassign-mode.png",
} as const;

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

test("staging /admin/members bulk tag picker assign/unassign baselines", async ({
  page,
}) => {
  await page.goto("/admin/members", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "会員管理" })).toBeVisible({
    timeout: 10_000,
  });

  const memberCheckboxes = page.locator('tbody input[type="checkbox"]');
  await expect(memberCheckboxes.nth(1), "at least two member rows are required").toBeVisible({
    timeout: 10_000,
  });
  await memberCheckboxes.nth(0).check();
  await memberCheckboxes.nth(1).check();

  const bulkRegion = page.getByRole("region", { name: "一括操作" });
  await expect(bulkRegion).toBeVisible({ timeout: 10_000 });
  const tagPicker = bulkRegion.getByRole("region", { name: "タグ一括付与・解除" });
  await expect(tagPicker).toBeVisible();
  await expect(
    tagPicker.getByText("付与可能なタグがありません"),
    "staging tag master must expose at least one tag for a meaningful picker baseline",
  ).toHaveCount(0);

  await page.addStyleTag({ content: disableAnimations });

  await expect(bulkRegion).toHaveScreenshot(SNAP.assign, {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
  mkdirSync(phase11ScreenshotsDir, { recursive: true });
  await bulkRegion.screenshot({
    path: join(phase11ScreenshotsDir, "bulk-tag-picker-assign-mode-authenticated-staging.png"),
    animations: "disabled",
  });

  const modeGroup = bulkRegion.getByRole("group", { name: "付与モード" });
  await modeGroup.getByRole("button", { name: "解除" }).click();
  await expect(modeGroup.getByRole("button", { name: "解除" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await expect(bulkRegion).toHaveScreenshot(SNAP.unassign, {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });

  await expect(page.getByTestId("bulk-tag-result")).toHaveCount(0);
  await bulkRegion.screenshot({
    path: join(phase11ScreenshotsDir, "bulk-tag-picker-unassign-mode-authenticated-staging.png"),
    animations: "disabled",
  });
});
