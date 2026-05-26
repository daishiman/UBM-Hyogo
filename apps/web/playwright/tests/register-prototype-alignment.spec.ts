import { expect, test } from "../fixtures/coverage";

// docs-only PR のため、本仕様 (register プロトタイプ整合) の e2e 検証は
// 後続 UI alignment ワークフローに委譲する。最低限 /register が 5xx を
// 返さないことのみ確認する暫定 smoke として残置。
test("/register responds without server error", async ({ page }) => {
  const response = await page.goto("/register");
  expect(response?.status()).toBeLessThan(500);
});

test.skip("/register matches member form prototype sections (deferred)", () => {
  // 本格的なセクション検証は visual-full / staging-visual ワークフローに集約予定。
});
