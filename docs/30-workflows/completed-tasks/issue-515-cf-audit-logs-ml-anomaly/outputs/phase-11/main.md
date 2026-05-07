# Phase 11 NON_VISUAL Evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| state | implemented_local_runtime_pending |
| visualEvidence | NON_VISUAL |

## Evidence

| evidence | 結果 |
| --- | --- |
| typecheck | `outputs/phase-11/typecheck.log`: PASS |
| lint | `outputs/phase-11/lint.log`: PASS |
| focused Vitest | `outputs/phase-11/vitest.log`: 8 files / 45 tests PASS |
| offline replay threshold | `outputs/phase-11/replay-threshold.json`: generated |
| offline replay ml fallback | `outputs/phase-11/replay-ml-fallback.json`: generated |
| secret leakage clean | `outputs/phase-11/leakage-clean.log`: exit 0 |
| secret leakage positive | `outputs/phase-11/leakage-positive.log`: expected exit 1 |
| exported feature leakage | `outputs/phase-11/exported-features-leakage.log`: exit 0 |
| analyze dry-run threshold | `outputs/phase-11/analyze-dry-run-threshold.log`: generated |
| analyze dry-run ml fallback | `outputs/phase-11/analyze-dry-run-ml-fallback.log`: generated |
| production apply | 未実施。Gate 後 follow-up |
| staging apply | 未実施。`pass_boundary_synced_runtime_pending` とは記録しない |

## AC Evidence Mapping

| AC | evidence |
| --- | --- |
| AC-1 Classifier interface | `scripts/cf-audit-log/classifier/types.ts`, `vitest.log` |
| AC-2 Threshold wrapper compatibility | `scripts/cf-audit-log/classifier/threshold.ts`, `vitest.log` |
| AC-3 ML fallback | `scripts/cf-audit-log/classifier/ml.ts`, `vitest.log`, `analyze-dry-run-ml-fallback.log` |
| AC-4 redacted feature extraction | `scripts/cf-audit-log/features/extract.ts`, `features-extract.test.ts`, `exported-features.jsonl`, `exported-features-leakage.log` |
| AC-5 analyzer classifier injection | `scripts/cf-audit-log/analyze.ts`, `analyze-dry-run-threshold.log` |
| AC-6 D1 classification columns | `apps/api/migrations/0016_cf_audit_log_classification.sql`; staging apply pending by Gate |
| AC-7 offline replay metrics | `replay-threshold.json`, `replay-ml-fallback.json`, `evaluation.test.ts` |
| AC-8 leakage grep failure path | `leakage-positive.log`, `evaluation.test.ts` |
| AC-9 GitHub Actions env | `.github/workflows/cf-audit-log-monitor.yml` |
| AC-10 local checks | `typecheck.log`, `lint.log`, `vitest.log` |
| AC-11 SSOT update | `outputs/phase-12/system-spec-update-summary.md` |
| AC-12 follow-up tasks | `outputs/phase-12/unassigned-task-detection.md` |
