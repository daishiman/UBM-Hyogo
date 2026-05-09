# Phase 12 Documentation Changelog

| File | Type | Summary |
| --- | --- | --- |
| `apps/api/scripts/runtime-smoke/run-smoke.sh` | add | Single read-only runtime smoke runner for staging rehearsal and production user-gated smoke |
| `apps/api/scripts/runtime-smoke/run-production-smoke.sh` | add | Compatibility wrapper around `run-smoke.sh --env production` |
| `apps/api/scripts/runtime-smoke/lib/api-url-guard.sh` | add | Production URL guard |
| `apps/api/scripts/runtime-smoke/lib/evidence-summary.sh` | add | Summary-only jq extraction helper |
| `apps/api/scripts/runtime-smoke/redact-filter-production.sh` | add | Production redaction entrypoint |
| `apps/api/scripts/runtime-smoke/README.md` | add | Runtime smoke usage note |
| `scripts/lib/redaction.sh` | edit | Production redaction patterns |
| `tests/unit/redaction.test.sh` | edit | Production redaction unit cases |
| `tests/unit/runtime-smoke.test.sh` | add | Runtime smoke dry-run and guard tests |
| `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | add | Production smoke runbook |
| `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/` | edit | State, naming, path, and Phase 12 compliance sync |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | edit | Issue #572 active inventory row |

