# Phase 11 Evidence Summary

| 項目 | 値 |
|------|-----|
| 実行日時 UTC | `2026-05-10T21:43:23Z` |
| 実行日時 JST | `2026-05-11T06:43:23+0900` |
| workflow_state | `implemented_local_evidence_captured` |
| evidence_state | `PASS_LOCAL_CANONICAL` |
| 対象 spec | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |

## Evidence Inventory

| evidence | 結果 |
|----------|------|
| `evidence/vitest-run.txt` | PASS: focused Vitest 1 file / 23 tests passed |
| `evidence/typecheck.txt` | PASS: `@ubm-hyogo/api` typecheck exit 0 |
| `evidence/api-lint.txt` | PASS: `@ubm-hyogo/api` lint exit 0 |
| `evidence/grep-gate.txt` | PASS: `z.object(` 0 / skip-fixme 0 / `apps/web` import 0 |
| `evidence/wc.txt` | PASS: 251 lines |
| `evidence/runner-version.txt` | PASS: Node v24.15.0 / Vitest 2.1.9 |
| `evidence/dirty-diff.txt` | PASS: expected `apps/api` contract diffs + `apps/web` identity-conflict fixture id alignment |
| `evidence/lint.txt` | INFO: root lint attempted; blocked by existing `apps/web` `monocart-reporter` type resolution, unrelated to this API contract change |

## Command Boundary

`pnpm --filter @ubm-hyogo/api test contract-stage-2` is not a focused command in this repository because the package script appends arguments after `apps/api`, so it collected the wider API suite and hit existing D1 fixture parallelism failures. The canonical focused command for this task is:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts --reporter=verbose
```

## Four-Condition Verdict

| 条件 | 判定 | 根拠 |
|------|------|------|
| 矛盾なし | PASS | root/output artifacts, index, Phase 11, Phase 12 all use `implemented_local_evidence_captured` + `PASS_LOCAL_CANONICAL` |
| 漏れなし | PASS | strict Phase 12 7 files and Phase 11 evidence files exist |
| 整合性あり | PASS | command contract, file paths, line count, schema names, and state vocabulary are aligned |
| 依存関係整合 | PASS | parent Stage 2 2d spec, source unassigned trace, and aiworkflow-requirements references are same-wave synchronized |
