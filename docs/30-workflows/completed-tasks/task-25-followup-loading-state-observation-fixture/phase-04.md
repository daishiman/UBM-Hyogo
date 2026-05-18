# Phase 4: テスト作成（fixture spec skeleton）

`[実装区分: 実装仕様書]`

## 目的

実装 Phase 5 に先行し、`apps/web/tests/e2e/staging-smoke.spec.ts` に追加する fixture spec の skeleton を確定する。実装が完成する前は当該テストは red、Phase 5 完了で green になることを期待値として明示する。

## 追加するテストケース

ファイル: `apps/web/tests/e2e/staging-smoke.spec.ts`
位置: 既存 `staging smoke / error boundary` describe block（行 105 付近）の直後に追記

### Test case 一覧

| ID | ケース | 期待値 |
|----|--------|--------|
| TC-01 | `GET /smoke/loading-state?delay=1500` で boundary が見える後に最終 render が見える | `[data-page="smoke-loading-state"]` + `role="status"` + 「読み込み中」が可視 → navigation 解決後に `[data-page="smoke-loading-state-fixture"]` が可視 |
| TC-02 | `GET /smoke/loading-state?delay=0` は boundary を skip して即時最終 render | `[data-page="smoke-loading-state-fixture"]` が `domcontentloaded` 後に可視 |
| TC-03 | `ENABLE_STAGING_SMOKE_FIXTURE` 無効環境では 404 | `smokeFixtureEnabled()` focused unit test で false を返す。route-level 404 は Phase 11 ローカル手順で確認対象 |

注: TC-03 は staging smoke の remote 実行では fixture env が有効化されているため、unit test でガード関数を固定し、Phase 11 の手動テストでローカル `ENABLE_STAGING_SMOKE_FIXTURE=0` route 404 を確認する。

## 変更対象ファイル

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/tests/e2e/staging-smoke.spec.ts` | 編集 | 末尾に describe block 追記（既存 `staging smoke / error boundary` block の直後） |
| `apps/web/app/__smoke__/_lib/fixture-guard.spec.ts` | 新規 | fixture flag / production guard / process env fallback を focused unit test 化 |

## 期待される spec の skeleton

```ts
test.describe("staging smoke / loading state", () => {
  test("GET /smoke/loading-state shows loading boundary then final render", async ({ page }) => {
    const navigation = page.goto(`${BASE}/smoke/loading-state?delay=1500`, { waitUntil: "commit" });
    await expect(page.locator('[data-page="smoke-loading-state"]')).toBeVisible();
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByText("読み込み中")).toBeVisible();
    await navigation;
    await expect(page.locator('[data-page="smoke-loading-state-fixture"]')).toBeVisible();
  });

  test("GET /smoke/loading-state?delay=0 skips boundary visibility", async ({ page }) => {
    await page.goto(`${BASE}/smoke/loading-state?delay=0`, { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-page="smoke-loading-state-fixture"]')).toBeVisible();
  });
});
```

## ローカル実行コマンド

```bash
mise exec -- pnpm exec playwright test apps/web/tests/e2e/staging-smoke.spec.ts \
  --grep "staging smoke / loading state"
```

期待: Phase 5 完了前は **red**（route が存在しないため 404）、Phase 5 完了後は **green**。

## DoD（Phase 4）

- skeleton が staging-smoke.spec.ts に追記され、`pnpm typecheck` が pass。
- 当該テストは route 未実装のため fail し、fail メッセージが「`smoke-loading-state` locator が見つからない」または 404 であることを Phase 5 が解消する root cause として記録。
