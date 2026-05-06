# 09b Incident Response Runbook

## Purpose

This runbook defines the incident-response boundary consumed by 09b-A runtime smoke and 09c production release.

## Alert Channels

| Channel | Canonical secret | Scope |
| --- | --- | --- |
| Sentry API Worker event capture | `SENTRY_DSN_API` | API Worker errors and smoke events |
| Slack incident webhook | `SLACK_WEBHOOK_INCIDENT` | Incident notification and smoke messages |
| Optional Slack workflow | `SLACK_WORKFLOW_URL` | Only when the runtime wave adopts workflow-based dispatch |

## Initial Response

1. Confirm whether the triggering event is staging or production.
2. Open the linked Sentry event id or Slack permalink from redacted evidence.
3. Check recent `sync_jobs` / Worker error context without exposing PII or secret values.
4. If a DSN or webhook literal appears in repo/evidence, stop response work and rotate the affected provider secret.

## 09b-A Runtime Smoke Contract

`POST /admin/smoke/observability` is the API-side smoke route for dev/staging. Production returns 404 for this route. Runtime PASS requires real provider evidence, not only route tests.

## Redaction Rules

- Never store DSN URLs, Slack webhook URLs, token values, or value hashes.
- Secret names, `op://...` references, short Sentry event ids, timestamps, and Slack permalinks are allowed.
