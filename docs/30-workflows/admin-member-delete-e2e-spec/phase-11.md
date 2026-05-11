# Phase 11: 実行・evidence 取得（NON_VISUAL）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |
| visualEvidence | `NON_VISUAL` |

## 1. 取得 evidence（canonical paths）

`docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-11/evidence/` 配下に以下を保存（canonical は tracked `.txt` / `.md`。`.log` を canonical evidence にしない）。

| # | path | 内容 | 取得コマンド |
|---|------|------|-----------|
| 1 | `outputs/phase-11/evidence/typecheck.txt` | typecheck 結果 | `mkdir -p docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-11/evidence && mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 \| tee docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-11/evidence/typecheck.txt` |
| 2 | `outputs/phase-11/evidence/lint.txt` | lint 結果 | `mise exec -- pnpm lint 2>&1 \| tee docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-11/evidence/lint.txt` |
| 3 | `outputs/phase-11/evidence/e2e-run.txt` | spec 実行ログ | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-member-delete.spec.ts --project=desktop-chromium 2>&1 \| tee docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-11/evidence/e2e-run.txt` |
| 4 | `outputs/phase-11/evidence/grep-gate.txt` | grep 監視ガード | `page.route=1 / fetch=0 / test.skip=1 / test.fixme=0` |
| 5 | `outputs/phase-11/evidence/runner-version.txt` | Playwright / Node version | `node -v` + `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright --version` |
| 6 | `outputs/phase-11/evidence/wc.txt` | spec 行数 | `wc -l apps/web/playwright/tests/admin-member-delete.spec.ts` |
| 7 | `outputs/phase-11/evidence/dirty-diff.txt` | apps/packages dirty diff | `git status --porcelain apps/ packages/` |

## 2. 期待値（PASS 条件）

| # | 観点 | 期待 |
|---|------|------|
| 1 | typecheck | exit 0 |
| 2 | lint | exit 0 |
| 3 | e2e | desktop-chromium 5 pass + 1 skip |
| 4 | skip 件数 | = 1 |
| 5 | `page.route(` count | ≥ 1 |
| 6 | `fetch(` count | = 0 |
| 7 | spec 行数 | 175 |

## 3. main.md（Phase 11 サマリ）

`outputs/phase-11/main.md` に以下を含める:

- 実行日時（UTC + JST）
- 実行ホスト（`uname -a` 出力）
- 各 evidence ファイルへの相対 path
- PASS / FAIL 集計（7 観点）
- workflow_state（PASS なら `runtime_pending` → `completed` 候補。FAIL なら状態維持）

## 4. 状態語彙

| 条件 | workflow_state |
|------|---------------|
| local evidence すべて PASS | `implemented-local-runtime-pending` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| 1 件以上 FAIL | `runtime_pending` のまま、Phase 6/7 へ revert |

## 5. dirty diff ガード

```bash
git status --porcelain apps/ packages/ | tee docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-11/evidence/dirty-diff.txt
```

期待 dirty diff は `apps/web/playwright/tests/admin-member-delete.spec.ts`、`apps/web/src/lib/admin/server-fetch.ts`、`apps/web/playwright.config.ts` の 3 件のみ。API route / fixture / packages の dirty diff があれば Phase 12 close-out FAIL（dirty-code gate, skill v2026.05.07-task19-placeholder-dirty-code-gates）。
