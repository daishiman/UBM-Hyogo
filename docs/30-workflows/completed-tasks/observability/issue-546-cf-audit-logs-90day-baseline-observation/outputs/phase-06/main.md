# Phase 6 Output: Execution Command Specification

Status: `PASS_WITH_RUNTIME_PARTIAL`

## Executed On 2026-05-08

| Command Family | Result | Output |
| --- | --- | --- |
| `gh api --paginate ... cf-audit-log-monitor.yml/runs` | PASS | `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` |
| `gh run list --workflow=cf-audit-log-monitor-watchdog.yml` | PASS | `outputs/phase-11/gh-run-list-watchdog.json` |
| `gh issue list --label cf-audit` | PASS | `outputs/phase-11/gh-issues-cf-audit.json` |
| `gh issue list --search "cf-audit tuning OR cf audit baseline"` | PASS | `outputs/phase-11/tuning-cost-issues.json` |
| `bash scripts/cf.sh audit-log baseline --days 90` | FAIL | esbuild host/binary version mismatch |
| `bash scripts/cf.sh d1 execute ... SELECT COUNT(*)` | FAIL | D1 reported `no such table: cf_audit_log` |

## Handoff

Proceed to Phase 7/8 with the failures classified as runtime environment/schema readiness blockers, not code changes for this docs-only observation task.
