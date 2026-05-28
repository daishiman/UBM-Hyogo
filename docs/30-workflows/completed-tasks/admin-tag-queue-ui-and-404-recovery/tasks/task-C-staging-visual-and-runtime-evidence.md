# task-C: staging visual smoke + Phase 11 evidence

[実装区分: 実装仕様書]

## 目的

`/admin/tags` のプロトタイプ整合 + 404 fix を staging で視覚的に確認し、PR 本文に貼れる evidence を残す。

## 変更対象ファイル

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts` | new | staging に対し 2 screen（empty / with-items）を撮影 |
| `outputs/phase-11/admin-tags-empty.png` | new | spec 実行結果 |
| `outputs/phase-11/admin-tags-items.png` | new | spec 実行結果 |
| `outputs/phase-11/manual-test-result.md` | new | 実行コマンド + 観測結果 |

## visual smoke 構造

```ts
import { test, expect } from "@playwright/test";

test.describe("admin-tags visual smoke @staging-visual-authenticated", () => {
  test.use({ storageState: "playwright/.auth/admin.storageState.json" });

  test("tag queue page renders page-head + grid-2 layout", async ({ page }) => {
    await page.goto("/admin/tags");
    await expect(page.getByRole("heading", { name: "タグキュー" })).toBeVisible();
    await expect(page.getByTestId("admin-tag-queue-list")).toBeVisible();
    await expect(page.getByTestId("admin-tag-review-panel")).toBeVisible();
    await expect(page).toHaveScreenshot("admin-tags-items.png", { fullPage: true });
    await page.screenshot({ path: "outputs/phase-11/admin-tags-items.png", fullPage: true });
  });

  test("tag queue page empty state when no items", async ({ page }) => {
    await page.goto("/admin/tags?status=rejected");
    await expect(page.getByText("該当するキューはありません")).toBeVisible();
    await expect(page).toHaveScreenshot("admin-tags-empty.png", { fullPage: true });
    await page.screenshot({ path: "outputs/phase-11/admin-tags-empty.png", fullPage: true });
  });
});
```

> storageState は `staging-visual-authenticated` project の setup が生成する `apps/web/playwright/.auth/admin.storageState.json` を使う。

## ローカル実行 / 検証

```bash
# 既存 staging-visual-authenticated project に乗せる
mise exec -- pnpm --filter web exec playwright test \
  --project=staging-visual-authenticated \
  apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts

# baseline 更新（初回のみ）
mise exec -- pnpm --filter web exec playwright test \
  --project=staging-visual-authenticated \
  apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts \
  --update-snapshots
```

## evidence 配置

実行後、spec が `docs/30-workflows/completed-tasks/admin-tag-queue-ui-and-404-recovery/outputs/phase-11/admin-tags-{items,empty}.png` を直接生成する。コピー手順は不要。

`outputs/phase-11/manual-test-result.md` には次を記す:

- 実行日時
- 実行コマンド
- staging URL / commit SHA
- 期待表示と実観測の差分

## DoD

- `admin-tags-authenticated.spec.ts` が staging で 2 ケース pass
- PNG 2 枚が `outputs/phase-11/` に存在
- `manual-test-result.md` が evidence summary を満たす
- `playwright-smoke / visual (chromium, ...)` の matrix を**変更しない**こと（既存 required check を壊さない）
