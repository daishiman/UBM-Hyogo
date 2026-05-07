# Webhook Smoke Log

Status: PASS

| Gate | State | Evidence |
| --- | --- | --- |
| G3 | PASS | Production secret uploaded after staging smoke PASS (HTTP 200 + Slack delivery confirmed) |
| G4 | PASS | Production smoke HTTP 200 + redaction grep 0 hits + GitHub Actions secret registered |

## G3: Cloudflare Production Secret + Staging Smoke PASS

| Field | Value |
| --- | --- |
| prerequisite | G1 / G2 PASS |
| user approval timestamp | `2026-05-07T10:50:00Z` |
| approver | `daishimanju` |
| `cf.sh secret put --env production` timestamp | `2026-05-07T10:51:00Z` |
| `cf.sh secret list --env production` name-only excerpt | `"name": "SLACK_WEBHOOK_INCIDENT"` |
| `gh secret set` timestamp | `2026-05-07T10:52:31Z` |
| `gh secret list` name-only excerpt | `SLACK_WEBHOOK_INCIDENT  2026-05-07T10:52:31Z` |
| staging POST timestamp | `2026-05-07T10:49:00Z` |
| staging response status | `200` |
| Slack message prefix | `smoke test from local (staging webhook)` |
| Slack permalink | `<not stored; non-secret prefix only>` |
| AC-5 PASS | `yes` |

## G4: Production Smoke + Redaction Grep Gate

| Field | Value |
| --- | --- |
| user approval timestamp | `2026-05-07T10:53:00Z` |
| approver | `daishimanju` |
| production POST timestamp | `2026-05-07T10:53:30Z` |
| production response status | `200` |
| Slack message prefix | `smoke test from local (production webhook)` |
| Slack permalink | `<not stored; non-secret prefix only>` |
| `hooks.slack.com/services` hit count | `0` |
| `B-id/token` hit count | `0` |
| `xox[bp]-` hit count | `0` |
| workspace fragment hit count | `0` |
| AC-6 PASS | `yes` |
| AC-7 PASS | `yes` |

Notes:
- `bash scripts/redaction-grep.sh .` summary: `OK: redaction grep 4 patterns, 0 hits`.
- Webhook URL value, workspace identifier (`T...`), and full channel id are never stored. Only status codes, smoke prefixes, timestamps, and redacted identifiers are kept.
- 1Password references in `.env` (resolved via `op run --env-file=.env`):
  - `SLACK_WEBHOOK_INCIDENT_STAGING="op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING"`
  - `SLACK_WEBHOOK_INCIDENT_PRODUCTION="op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_PRODUCTION"`
