# Phase 11 Evidence Index — issue-655-d7-recovery-2nd-cycle

## Boundary

This workflow is `implemented-local-runtime-pending / IMPLEMENTED_LOCAL_RUNTIME_PENDING`.
The current cycle includes PR-A local implementation for scripts, workflow YAML,
runbook, focused tests, and local verification evidence. Runtime collection,
workflow dispatch, commit, push, PR creation, and `pass_runtime_synced` promotion
remain user-gated.

## Template Evidence Files

| Path | Status | Purpose |
| --- | --- | --- |
| `outputs/phase-11/evidence/hourly-run-1st-cycle-listing.json.RUNTIME_PENDING_USER_APPROVAL.md` | runtime_pending | Read-only `gh run list` capture instructions |
| `outputs/phase-11/evidence/recovery-rootcause.md` | completed | Root cause classification from read-only GitHub Actions evidence |
| `outputs/phase-11/evidence/local-verify.log` | completed | Local verification command ledger |
| `outputs/phase-11/evidence/ci-dry-run.md.RUNTIME_PENDING_USER_APPROVAL.md` | runtime_pending | PR-A workflow dry-run ledger |
| `outputs/phase-11/evidence/recovery-d-minus-1.log` | runtime_pending | D'-1 hourly success confirmation |
| `outputs/phase-11/evidence/hourly-run-daily-check-recovery.md` | runtime_pending | D'+1 / D'+3 / D'+5 daily checks |
| `outputs/phase-11/evidence/hourly-run-7day-recovery.md` | runtime_pending | 168 recovery run URL list |
| `outputs/phase-11/evidence/hourly-run-7day-summary-recovery.json.RUNTIME_PENDING_USER_APPROVAL.md` | runtime_pending | D'+7 recovery aggregate placeholder |
| `outputs/phase-11/evidence/leakage-grep-7day-recovery.log` | runtime_pending | 168 hour leakage grep |
| `outputs/phase-11/evidence/issue-rate-comparison-recovery.md` | runtime_pending | Baseline / 1st cycle / recovery comparison |

## Canonical Manifest

`outputs/phase-11/canonical-paths.json` lists the planned evidence paths and
marks runtime-only files as pending user approval, preventing false runtime PASS.
