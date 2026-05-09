# Phase 11 NON_VISUAL Evidence Ledger

Status: IMPLEMENTED_LOCAL_EVIDENCE_RECORDED

This task has no UI/UX surface, so no screenshot is required. Phase 11 evidence is command-based.

## Fresh Evidence

| Evidence | Result |
| --- | --- |
| `evidence/typecheck.log` | PASS |
| `evidence/lint.log` | PASS |
| `evidence/focused-tests.log` | PASS: changed-path focused tests; post-review provider contract regression 3 files / 32 tests |
| `evidence/grep-direct-import.log` | PASS: 0 direct target repository imports in routes/workflows/use-cases |
| `evidence/grep-fallback.log` | REVIEWED: no DI container introduction; allowed test seam documented |
| `evidence/coverage-guard.log` | `coverage-guard` no-op; full coverage attempted but blocked by Miniflare port exhaustion |

## Notes

The created spec initially used stale command names; current evidence uses actual package `@ubm-hyogo/api` with `typecheck`, `lint`, and file-scoped Vitest commands.

## Follow-up via Issue #577（2026-05-09 同期追記）

`@ubm-hyogo/api` full coverage の Miniflare/undici `EADDRNOTAVAIL` port exhaustion について、`docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/` で rerun + triage を実施し、軸 B（`--maxWorkers=1 --minWorkers=1`）採用 / `apps/api/package.json#scripts.test:coverage` に最小差分 patch / 133/133 PASS / 0 EADDRNOTAVAIL を確認した。

evidence canonical path（相対参照）:
- `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence/full-coverage-rerun.log`
- `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence/triage-summary.md`
- `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence/baseline-rerun-{1,2,3}.log`
- `docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence/triage-matrix-maxWorkers-1.log`

Issue #532 は CLOSED 維持（state 変更なし）。この follow-up は Issue #577 PR で取り込む。
