// workflow: issue-1077 / authenticated staging bulk tag picker visual baseline.
// Read-only capture: selects members and toggles picker mode, but never applies tags.

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { VIEWPORTS } from "../../fixtures/viewports";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPhase11ScreenshotsDir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/issue-1126-bulk-tag-picker-viewport-baseline-expansion/outputs/phase-11/screenshots",
);
const phase11ScreenshotsDir = process.env.PLAYWRIGHT_SCREENSHOT_DIR ?? defaultPhase11ScreenshotsDir;

const SNAP = {
  assign: "bulk-tag-picker-assign-mode.png",
  unassign: "bulk-tag-picker-unassign-mode.png",
} as const;

const RESPONSIVE_VIEWPORTS = [
  { name: "mobile", ...VIEWPORTS.mobile },
  { name: "tablet", ...VIEWPORTS.tablet },
  { name: "wide", ...VIEWPORTS.wide },
] as const;

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

async function prepareBulkRegion(page: Page) {
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

  return bulkRegion;
}

async function switchToUnassignMode(page: Page) {
  const modeGroup = page.getByRole("region", { name: "一括操作" }).getByRole("group", {
    name: "付与モード",
  });
  await modeGroup.getByRole("button", { name: "解除" }).click();
  await expect(modeGroup.getByRole("button", { name: "解除" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}

async function captureAndAssertBulkRegion(bulkRegion: Locator, screenshotName: string) {
  mkdirSync(phase11ScreenshotsDir, { recursive: true });
  await bulkRegion.screenshot({
    path: join(phase11ScreenshotsDir, screenshotName),
    animations: "disabled",
  });
  await expect(bulkRegion).toHaveScreenshot(screenshotName, {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
}

test("staging /admin/members bulk tag picker assign/unassign baselines", async ({
  page,
}) => {
  const bulkRegion = await prepareBulkRegion(page);

  await captureAndAssertBulkRegion(bulkRegion, SNAP.assign);

  await switchToUnassignMode(page);

  await captureAndAssertBulkRegion(bulkRegion, SNAP.unassign);

  await expect(page.getByTestId("bulk-tag-result")).toHaveCount(0);
});

for (const viewport of RESPONSIVE_VIEWPORTS) {
  test(`staging /admin/members bulk tag picker ${viewport.name} assign/unassign baselines`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const bulkRegion = await prepareBulkRegion(page);

    await captureAndAssertBulkRegion(
      bulkRegion,
      `bulk-tag-picker-assign-mode-${viewport.name}.png`,
    );

    await switchToUnassignMode(page);

    await captureAndAssertBulkRegion(
      bulkRegion,
      `bulk-tag-picker-unassign-mode-${viewport.name}.png`,
    );

    await expect(page.getByTestId("bulk-tag-result")).toHaveCount(0);
  });
}
