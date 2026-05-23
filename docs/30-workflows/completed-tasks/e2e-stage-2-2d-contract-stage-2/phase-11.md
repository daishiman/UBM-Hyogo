# Phase 11: 実行・evidence 取得（NON_VISUAL）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |
| visualEvidence | `NON_VISUAL` |

## 1. 取得 evidence（canonical paths）

`docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-11/evidence/` 配下に以下を保存（canonical は tracked `.txt` / `.md`。`.log` を canonical evidence にしない）。

| # | path | 内容 | 取得コマンド |
|---|------|------|-----------|
| 1 | `outputs/phase-11/evidence/typecheck.txt` | typecheck 結果 | `mkdir -p docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-11/evidence && mise exec -- pnpm --filter @ubm-hyogo/api typecheck 2>&1 \| tee docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-11/evidence/typecheck.txt` |
| 2 | `outputs/phase-11/evidence/api-lint.txt` | `@ubm-hyogo/api` lint 結果 | `mise exec -- pnpm --filter @ubm-hyogo/api lint 2>&1 \| tee docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-11/evidence/api-lint.txt` |
| 3 | `outputs/phase-11/evidence/vitest-run.txt` | spec 実行ログ | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts --reporter=verbose 2>&1 \| tee docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-11/evidence/vitest-run.txt` |
| 4 | `outputs/phase-11/evidence/grep-gate.txt` | grep 監視ガード（`z.object(`=0 / `test.skip`=0 / `apps/web` import=0 / 行数 251） | grep + `wc -l` を順次実行し tee |
| 5 | `outputs/phase-11/evidence/runner-version.txt` | Node / Vitest version | `node -v` + `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest --version` |
| 6 | `outputs/phase-11/evidence/wc.txt` | spec 行数 | `wc -l apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| 7 | `outputs/phase-11/evidence/dirty-diff.txt` | apps/packages dirty diff | `git status --porcelain apps/ packages/` |
| 8 | `outputs/phase-11/evidence/lint.txt` | root lint 境界確認（参考） | `mise exec -- pnpm lint 2>&1 \| tee docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-11/evidence/lint.txt` |

## 2. 期待値（PASS 条件）

| # | 観点 | 期待 |
|---|------|------|
| 1 | typecheck | exit 0 |
| 2 | `@ubm-hyogo/api` lint | exit 0 |
| 3 | vitest（contract-stage-2） | 7 describe / 全 it pass |
| 4 | skip 件数 | = 0 |
| 5 | `z.object(` count | = 0 |
| 6 | `apps/web` import count | = 0 |
| 7 | spec 行数 | 251 |
| 8 | root lint 境界確認 | 既存 `apps/web` 側依存解決で失敗する場合は参考情報として記録し、本 API contract gate の PASS 条件から除外 |

## 3. main.md（Phase 11 サマリ）

`outputs/phase-11/main.md` に以下を含める:

- 実行日時（UTC + JST）
- 実行ホスト（`uname -a` 出力）
- 各 evidence ファイルへの相対 path
- PASS / FAIL 集計（7 観点 + root lint 境界情報）
- workflow_state（PASS なら `implemented_local_evidence_captured`。Phase 13 commit / push / PR は user gate）

## 4. 状態語彙

| 条件 | workflow_state |
|------|---------------|
| canonical local evidence すべて PASS | `implemented_local_evidence_captured`（contract test は pure unit のため runtime / staging 区別なし。local pass = canonical pass） |
| 1 件以上 FAIL | `runtime_pending` のまま、Phase 6/7 へ revert |

## 5. dirty diff ガード

```bash
git status --porcelain apps/ packages/ | tee docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-11/evidence/dirty-diff.txt
```

期待 dirty diff:
- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`（新規）
- `apps/api/src/routes/admin/member-delete.ts`（+1 字句）
- `apps/api/src/routes/admin/requests.ts`（+1 行）
- `apps/api/src/routes/admin/audit.ts`（+1 行）

`apps/web` / `packages/shared` / migrations / `wrangler.toml` の dirty diff があれば Phase 12 close-out FAIL（dirty-code gate, skill v2026.05.07-task19-placeholder-dirty-code-gates）。
