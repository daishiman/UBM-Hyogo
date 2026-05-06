# 09b Release Runbook

## Purpose

This runbook is the canonical release-readiness handoff for 09c. It records the operational gates that must be true before production release can proceed.

## Required Gates

| Gate | Requirement | Evidence |
| --- | --- | --- |
| Cron schedule | `apps/api/wrangler.toml` cron facts are reviewed before release | 09c production deploy evidence |
| Staging smoke | 09a staging smoke evidence is available | 09a Phase 11 outputs |
| Observability smoke | 09b-A Sentry / Slack runtime evidence is available | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-11/` |
| Secret hygiene | DSN URL, Slack webhook URL, token values, and hashes are absent from repo evidence | 09b-A redaction grep |

## 09b-A Observability Handoff

Release readiness remains blocked while 09b-A is `contract_ready_runtime_pending`. The runtime wave must provide:

- `sentry-secret-list-redacted.md`
- `sentry-test-event-id.md`
- `slack-secret-list-redacted.md`
- `slack-test-notification-evidence.md`
- `redaction-grep-result.md`
- `user-approval-record.md` when production secret registration is requested

## Secret Boundary

Use `SLACK_WEBHOOK_INCIDENT` for incident response. Do not introduce new uses of legacy `SLACK_ALERT_WEBHOOK_URL` for 09b-A.
