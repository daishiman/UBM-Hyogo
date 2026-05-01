# Phase 7 成果物 — AC マトリクス

## 状態
- 実行済（2026-05-01）

| AC | 要求 | 検証手段 | 結果 | evidence |
| --- | --- | --- | --- | --- |
| AC-1 | apps/api build 成果物に `__fixtures__/**` `__tests__/**` ファイルを含めない | esbuild 直接 bundle → `grep -c "__fixtures__\|__tests__\|miniflare" /tmp/api-bundle.js` | **0 件 / PASS** | outputs/phase-11/main.md |
| AC-2 | `pnpm test` が引き続き通る | vitest 設定不変・runtime コード不変。typecheck 成功で本 diff 起因 regression なしを確認。ただし既存 `sync-forms-responses.test.ts` 4 failures により full suite は FAIL | **PARTIAL** | outputs/phase-09/main.md / `docs/30-workflows/unassigned-task/task-02c-followup-002-sync-forms-responses-test-baseline-001.md` |
| AC-3 | production code → `__fixtures__` import が `.dependency-cruiser.cjs` で error | 合成違反ファイル投入で `no-prod-to-fixtures-or-tests` rule が error 発火 | **PASS** | outputs/phase-06/main.md |
| AC-4 | `pnpm build` または `wrangler deploy --dry-run` の bundle サイズ縮小を記録 | esbuild bundle 792.9 KB / build から exclude する test+fixture source 344,831 B (47.7%) | **PASS（数値記録）** | outputs/phase-11/main.md |
| AC-5 | 02c implementation-guide.md 不変条件 #6 節への補強差分 | 完了タスクの implementation-guide.md に「#6 の三重防御」sub-section 追記 | **PASS** | docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/implementation-guide.md |

不変条件 touched:
- #6 dev fixture を production seed として扱わない → build / lint / runtime bundling の三層で固定。
- production runtime に test 専用依存（miniflare 等）を流入させない → bundle 検査で 0 件。
- Cloudflare Workers free-tier bundle size 上限 → 本タスクで bundle 増加なし、test/fixture を構造的に除外。
