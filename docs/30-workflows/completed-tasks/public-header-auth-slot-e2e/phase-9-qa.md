# Phase 9 — QA

## 1. QA チェックリスト

| # | 項目 | 実行コマンド | 期待 |
|---|------|--------------|------|
| 1 | 型チェック | `mise exec -- pnpm typecheck` | green |
| 2 | lint | `mise exec -- pnpm lint` | green |
| 3 | テスト命名規約 | `git ls-files apps/web/playwright/tests/*.test.ts` | 0 件 |
| 4 | spec dry-run | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=auth-slot-coverage --list` | 25 TC を列挙 |
| 5 | setup-auth dry-run | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=setup-auth --list` | 3 setup（guest/member/admin）を列挙 |
| 6 | 既存 projects への regression | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium --list \| grep -E 'auth-slot\|setup-auth'` | 0 件 |
| 7 | .gitignore 動作 | `git status apps/web/playwright/.auth/` | tracked file なし |
| 8 | CI yaml lint | `yamllint .github/workflows/playwright-smoke.yml`（任意） | error なし |
| 9 | PII grep | `grep -r 'authjs.session-token' apps/web/playwright/tests/` | 直接記述なし（fixtures 経由のみ） |

## 2. 実行済み / user-gated 項目

- local Playwright 実行（setup-auth → auth-slot-coverage）は実行済み。28/28 PASS（3 setup + 25 auth-slot）。
- CI workflow_dispatch / remote GitHub Actions runtime は user-gated。
- staging URL に対する実行は本 workflow の対象外（local auth-slot contract）。

## 3. fail 時の切り分け

| 症状 | 切り分け |
|------|----------|
| setup-auth で storageState JSON が生成されない | `apps/web/playwright/.auth/` ディレクトリ存在確認 + `signSessionJwt` の secret 確認 |
| auth-slot-coverage で `data-auth-state` 属性未検出 | 親 workflow Task A-F の DoD 未達。親 PR merge 待ち |
| redirect が `/login` に飛ばない | `apps/web/middleware.ts` or `/profile`/`/admin` の server guard 確認 |
| `data-role="public-return"` 未検出（admin shell） | Task F の DoD に `data-route-group="admin"` 親 div の `data-auth-state="admin"` 付与が未反映 |
| CI auth-slot job timeout | `needs: smoke` 完了待ち時間 + 21 TC 実行時間が 15min 超。timeout-minutes 引き上げ検討 |

## 4. DoD（QA 層）

- [ ] §1 の 9 項目すべて green
- [ ] §2 の local 実行結果が Phase 11 manual-test-result.md に PASS として記録される
- [ ] §3 切り分けマトリクスが Phase 11 evidence の troubleshooting セクションに転記される
