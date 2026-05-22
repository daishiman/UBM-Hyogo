# Phase 9: 品質保証

## 実行コマンドと結果

| コマンド | 結果 |
|----------|------|
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS（`tsc --noEmit` + `eslint src/**/*.{ts,tsx}`） |

## 静的チェックの観点

- `_ASSERT_17: 17 = VISUAL_ROUTES.length as 17` により 17 routes 不変条件を型レベルで保証。
- `apps/web/playwright.config.ts` の既存 project（`desktop-chromium` / `desktop-firefox` / `mobile-webkit`）の `testIgnore` に `visual-full/` パターンを追加し、新 spec が誤って他 project から実行されないようにした。
- 新 spec は既存 `auth.ts` の `adminLogin` / `memberLogin` を再利用しており、新規 setup project や storageState ファイル生成は不要。

## 未実行項目（仕様通り保留）

- 51 baseline 画像生成・diff 0 検証 — ubuntu-latest 上の `workflow_dispatch` 経由で実施するため、本フェーズではローカル実行しない。
- nightly cron / path-filter PR trigger の実 GitHub 上での発火確認 — PR マージ後に確認。
