# Phase 3 — 設計レビュー

## 1. 不変条件適合チェック

| # | 不変条件 | Phase 2 の対応 | 判定 |
|---|---------|----------------|------|
| 1 | 新 endpoint 追加禁止 | 既存 mock api / Auth.js のみ利用、route 追加なし | OK |
| 2 | `signSessionJwt` 再利用 | `setup-auth.spec.ts` から `adminLogin` / `memberLogin` を import | OK |
| 3 | `*.spec.ts` 命名 | `auth-slot-coverage.spec.ts` / `setup-auth.spec.ts` 双方 `.spec.ts` | OK |
| 4 | PII 非露出 | log 出力なし。`storageState` JSON は `.gitignore` で除外 | OK |
| 5 | fail-closed redirect | `page.url()` が `/login(\?\|$)` にマッチで検証 | OK |
| 6 | `data-auth-state` 3 値 | `Expectation` 型を `State \| 'redirect'` に限定 | OK |
| 7 | 既存 smoke job 非破壊 | `needs: smoke`、既存 projects に `testIgnore` 追加で二重実行回避 | OK |

## 2. 既存資産との整合性

| 既存ファイル | 影響 | 対応 |
|--------------|------|------|
| `apps/web/playwright/fixtures/auth.ts` | 変更なし、import のみ | OK |
| `apps/web/playwright/tests/auth-gate-state.spec.ts` | 隣接 spec として参照 | 重複検証はない（あちらは gate state 単体、こちらは横断 matrix） |
| `apps/web/playwright.config.ts` | projects 配列に 2 entry 追加、既存 entry に testIgnore 追加 | conflict なし |
| `.github/workflows/playwright-smoke.yml` | `auth-slot` job 追加（`needs: smoke`） | 並列性 + 既存 visual job と並走可能 |

## 3. リスクと緩和策

| リスク | 緩和策 |
|--------|--------|
| storageState JSON のコミット混入 | `.gitignore` に `playwright/.auth/` 追加 + Phase 9 QA で `git status` 確認 |
| `signSessionJwt` の secret 変更で全 spec fail | env `AUTH_SECRET` を CI / local 双方で `playwright-e2e-auth-secret-32-bytes` に固定 |
| `/admin` redirect が server-side で 307 / client redirect どちらか不確定 | `page.url()` 検証は domcontentloaded 後の最終 URL を見るので両対応 |
| ROUTES 配列の DRY 化過剰 → debug 困難 | TC 名に `${state} viewing ${path}` を含め失敗時に特定容易化 |
| 既存 `desktop-chromium` project の testIgnore 漏れ | Phase 9 QA で `playwright test --list` 実行し overlap 0 を確認 |

## 4. 承認条件

- [x] 不変条件 7 項目すべて OK
- [x] 既存資産との整合性に conflict なし
- [x] リスク 5 項目の緩和策が Phase 4-9 に落ちている
- [x] CONST_007 違反なし（先送り project 追加なし、21 ケースすべて本サイクル完了）

## 5. レビュー結論

**承認**。Phase 4（テスト計画）へ進む。
