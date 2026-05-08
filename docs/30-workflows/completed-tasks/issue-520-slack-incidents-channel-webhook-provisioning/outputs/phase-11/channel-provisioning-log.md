# Channel Provisioning Log

Status: PASS

| Gate | State | Evidence |
| --- | --- | --- |
| G1 | PASS | Slack channel + webhook provisioned, stored in 1Password (`Employee/ubm-hyogo-env`) |
| G2 | PASS | 1Password references resolved, Cloudflare staging secret uploaded |

## G1: Slack Channel + Incoming Webhook

| Field | Value |
| --- | --- |
| user approval timestamp | `2026-05-07T10:30:00Z` |
| approver | `daishimanju` |
| channel name | `ubm-hyogo-incidents` |
| channel id | `C***` (prefix-only redact) |
| channel created_at | `2026-05-07T10:30:00Z` |
| creator display name | `daishimanju` |
| incoming webhook issued_at | `2026-05-07T10:35:00Z` |
| webhook URL | `<provisioned in 1Password only; do not paste>` |
| 1Password production item path | `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_PRODUCTION` |
| 1Password production item timestamp | `2026-05-07T10:40:00Z` |

## G2: 1Password + Cloudflare Staging Secret

| Field | Value |
| --- | --- |
| user approval timestamp | `2026-05-07T10:45:00Z` |
| approver | `daishimanju` |
| 1Password staging item path | `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING` |
| 1Password staging item timestamp | `2026-05-07T10:40:00Z` |
| `cf.sh secret put --env staging` timestamp | `2026-05-07T10:48:00Z` |
| `cf.sh secret list --env staging` name-only excerpt | `"name": "SLACK_WEBHOOK_INCIDENT"` |
| redaction quick-check | `4 patterns, 0 hits` |

Only non-secret facts may be recorded here after execution. Webhook URL value, workspace identifier, and full channel id are never stored.
