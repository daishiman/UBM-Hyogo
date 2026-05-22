# Phase 5: 実装ノート

## 実装したファイル

| パス | 種別 | 備考 |
|------|------|------|
| `apps/web/playwright/fixtures/viewports.ts` | 新規 | desktop/tablet/mobile viewport 定数 |
| `apps/web/playwright/fixtures/visual-routes.ts` | 新規 | 17 routes 配列 + `_ASSERT_17` 型ガード |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 新規 | 17 routes × project loop の screenshot spec |
| `apps/web/playwright.config.ts` | 編集 | `visual-full-chromium-{desktop,tablet,mobile}` project 3 件追加、既存 project の `testIgnore` に `visual-full/` を追加 |
| `apps/web/package.json` | 編集 | `test:visual-full` / `test:visual-full:update` scripts 追加 |
| `.github/workflows/playwright-visual-full.yml` | 新規 | nightly cron + PR path-filter, matrix viewport 並列 |
| `.github/workflows/playwright-visual-baseline-update.yml` | 新規 | `workflow_dispatch` + `environment: visual-baseline-approval` |

## 設計仕様との差分

Phase 2 設計では `storageState: 'playwright/.auth/<role>.json'` + `dependencies: ['setup-auth-member', 'setup-auth-admin']` を採用予定だったが、現行の `apps/web/playwright/` には `setup-auth-*` project が存在せず、認証は `apps/web/playwright/fixtures/auth.ts` の `adminLogin(context)` / `memberLogin(context)` ヘルパー経由（W7 既存スタイル）で行われている。

→ spec 内で同ヘルパーを直接呼び出す形式に変更（既存 W7 visual spec と同一の認証パターンに揃えた）。これにより新規 setup project を追加せずに admin/member 認証が解決できる。

## ローカル検証

```
mise exec -- pnpm --filter @ubm-hyogo/web typecheck  # PASS
mise exec -- pnpm --filter @ubm-hyogo/web lint       # PASS
```

`_ASSERT_17: 17 = VISUAL_ROUTES.length as 17` で 17 件をコンパイル時保証。

## baseline 生成について

Phase 5 仕様通り、51 png baseline はローカル macOS では生成・コミットせず、`playwright-visual-baseline-update.yml` を PR マージ後に `workflow_dispatch` で起動して ubuntu-latest 上で生成し、自動 PR 経由で取り込む方針。

## DoD チェック

1. ✅ `visual-full-chromium-{desktop,tablet,mobile}` project が `apps/web/playwright.config.ts` に追加されている
2. ✅ `apps/web/playwright/tests/visual-full/full-visual.spec.ts` が 17 routes を loop して screenshot を取得する構造
3. ⏸ 51 baseline png — baseline-update workflow 経由で別 PR で取り込む（仕様通り）
4. ✅ `.github/workflows/playwright-visual-full.yml` が cron + PR path-filter で発火
5. ✅ `.github/workflows/playwright-visual-baseline-update.yml` が `workflow_dispatch` + `environment: visual-baseline-approval` で gate
6. ⏸ ローカル PASS — baseline 未生成のため未確認（ubuntu CI 上で生成後に確認）
7. ✅ `pnpm typecheck` / `pnpm lint` PASS
