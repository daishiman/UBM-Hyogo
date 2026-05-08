# Manual Smoke Log

Status: PASS

This file records the NON_VISUAL Phase 11 manual smoke evidence after live Slack / Cloudflare / GitHub operations were executed by the user.

| Check | State |
| --- | --- |
| Slack channel exists | PASS (`#ubm-hyogo-incidents`) |
| Incoming webhook exists | PASS (URL stored in 1Password only) |
| Staging secret name-only check | PASS (`"name": "SLACK_WEBHOOK_INCIDENT"`) |
| Production secret name-only check | PASS (`"name": "SLACK_WEBHOOK_INCIDENT"`) |
| Staging smoke prefix | PASS (`smoke test from local (staging webhook)`, HTTP 200) |
| Production smoke prefix | PASS (`smoke test from local (production webhook)`, HTTP 200) |
| Redaction grep | PASS (`4 patterns, 0 hits`) |
| GitHub Actions secret | PASS (`SLACK_WEBHOOK_INCIDENT  2026-05-07T10:52:31Z`) |

## 1Password Reference Convention

The actual deployment uses a flat-item layout under `Employee/ubm-hyogo-env`:

- `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING`
- `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_PRODUCTION`

`.env` is the gitignored source of `op://` references; values flow through `op run --env-file=.env` only and are never written to disk in plaintext.
