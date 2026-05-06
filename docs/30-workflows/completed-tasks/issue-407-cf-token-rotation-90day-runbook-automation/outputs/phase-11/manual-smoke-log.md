# Phase 11 Manual Smoke Log

Status: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

| check | command | result |
| --- | --- | --- |
| runbook sections | `bash scripts/check-cf-rotation-reminder.sh --check-runbook-sections` | PASS |
| log fields | `bash scripts/check-cf-rotation-reminder.sh --check-log-fields` | PASS |
| yaml links | `bash scripts/check-cf-rotation-reminder.sh --check-yaml-links` | PASS |
| 85-day boundary | `ISSUED_AT=2026-02-10 bash scripts/check-cf-rotation-reminder.sh --simulate-elapsed` | PASS |
| secret hygiene | `bash scripts/check-cf-rotation-reminder.sh --check-no-secret` | PASS |
| token id hygiene | `bash scripts/check-cf-rotation-reminder.sh --check-no-token-id` | PASS |
| scope value hygiene | `bash scripts/check-cf-rotation-reminder.sh --check-no-scope-values` | PASS |

GitHub Actions dry-run and real Issue creation remain user-gated.
