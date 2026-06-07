// workflow: issue-1125 / authenticated staging bulk tag result visual baseline.
// Mutation capture: selects synthetic staging members, applies real bulk tag assign,
// and captures all-success plus deleted-member partial-failure result summaries.

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Locator, type Page } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11ScreenshotsDir =
  process.env.PLAYWRIGHT_EVIDENCE_DIR ??
  resolve(
    __dirname,
    "../../../../../docs/30-workflows/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-11/screenshots",
  );

const SNAP = {
  allSuccess: "bulk-tag-result-all-success.png",
  partialFailure: "bulk-tag-result-partial-failure.png",
} as const;

const ROWS = {
  all1: "e2e_test_issue1125_mem_all_1",
  all2: "e2e_test_issue1125_mem_all_2",
  partialActive: "e2e_test_issue1125_mem_partial_active",
  partialDeleted: "e2e_test_issue1125_mem_partial_deleted",
} as const;

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

async function gotoSyntheticMembers(page: Page, q: string) {
  await page.goto(`/admin/members?q=${encodeURIComponent(q)}&sort=name`, {
    waitUntil: "networkidle",
  });
  await expect(page.getByRole("heading", { name: "会員管理" })).toBeVisible({
    timeout: 10_000,
  });
}

async function selectRow(page: Page, memberId: string) {
  const row = page.getByTestId(`admin-members-row-${memberId}`);
  await expect(row, `seeded row ${memberId} must be visible`).toBeVisible({
    timeout: 10_000,
  });
  await row.locator('input[type="checkbox"]').check();
}

async function selectTag(bulkRegion: Locator, label: string) {
  const tagPicker = bulkRegion.getByRole("region", { name: "タグ一括付与・解除" });
  await expect(tagPicker).toBeVisible({ timeout: 10_000 });
  const search = tagPicker.getByRole("searchbox", { name: "タグを検索" });
  if ((await search.count()) > 0) {
    await search.fill(label);
  }
  await tagPicker.getByRole("button", { name: label }).click();
}

async function applyAndCapture(
  page: Page,
  snapName: string,
  assertion: (result: Locator) => Promise<void>,
) {
  const bulkRegion = page.getByRole("region", { name: "一括操作" });
  await expect(bulkRegion).toBeVisible({ timeout: 10_000 });
  await bulkRegion.getByRole("button", { name: /人 × 1タグ を付与$/ }).click();

  const result = page.getByTestId("bulk-tag-result");
  await expect(result).toBeVisible({ timeout: 15_000 });
  await assertion(result);

  await page.addStyleTag({ content: disableAnimations });
  await expect(result).toHaveScreenshot(snapName, {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
  mkdirSync(phase11ScreenshotsDir, { recursive: true });
  await result.screenshot({
    path: join(phase11ScreenshotsDir, snapName.replace(".png", "-authenticated-staging.png")),
    animations: "disabled",
  });
}

test("staging /admin/members bulk tag result all-success baseline", async ({ page }) => {
  await gotoSyntheticMembers(page, "e2e_test_issue1125_all_success");
  await selectRow(page, ROWS.all1);
  await selectRow(page, ROWS.all2);

  const bulkRegion = page.getByRole("region", { name: "一括操作" });
  await selectTag(bulkRegion, "issue1125 result all-success");
  await applyAndCapture(page, SNAP.allSuccess, async (result) => {
    await expect(result.getByTestId("bulk-tag-result-counts")).toContainText(
      "付与 2 / 解除 0 / 変更なし 0 / 退会済みスキップ 0 / 未登録タグ 0",
    );
    await expect(page.getByTestId("bulk-tag-result-skipped")).toHaveCount(0);
    await expect(page.getByTestId("bulk-tag-result-not-found")).toHaveCount(0);
  });
});

test("staging /admin/members bulk tag result partial-failure baseline", async ({ page }) => {
  await gotoSyntheticMembers(page, "e2e_test_issue1125_partial");
  await selectRow(page, ROWS.partialActive);
  await selectRow(page, ROWS.partialDeleted);

  const bulkRegion = page.getByRole("region", { name: "一括操作" });
  await selectTag(bulkRegion, "issue1125 result partial-failure");
  await applyAndCapture(page, SNAP.partialFailure, async (result) => {
    await expect(result.getByTestId("bulk-tag-result-counts")).toContainText(
      "付与 1 / 解除 0 / 変更なし 0 / 退会済みスキップ 1 / 未登録タグ 0",
    );
    await expect(page.getByTestId("bulk-tag-result-skipped")).toContainText(
      "退会済みのためスキップ: e2e_test_issue1125_partial_deleted",
    );
    await expect(page.getByTestId("bulk-tag-result-not-found")).toHaveCount(0);
  });
});
