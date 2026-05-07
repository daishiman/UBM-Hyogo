# Channel Provisioning Log

Status: PENDING_RUNTIME_EVIDENCE

| Gate | State | Evidence |
| --- | --- | --- |
| G1 | pending_user_approval | Slack channel / webhook not executed |
| G2 | pending_user_approval | 1Password and staging Cloudflare secret not executed |

## G1: Slack Channel + Incoming Webhook

| Field | Value |
| --- | --- |
| user approval timestamp | `<pending>` |
| approver | `<pending>` |
| channel name | `ubm-hyogo-incidents` |
| channel id | `<C*** redacted prefix after approval>` |
| channel created_at | `<pending>` |
| creator display name | `<pending>` |
| incoming webhook issued_at | `<pending>` |
| webhook URL | `<provisioned in 1Password only; do not paste>` |
| 1Password production item path | `op://UBM-Hyogo/Slack Incident Webhook (production)/url` |
| 1Password production item timestamp | `<pending>` |

## G2: 1Password + Cloudflare Staging Secret

| Field | Value |
| --- | --- |
| user approval timestamp | `<pending>` |
| approver | `<pending>` |
| 1Password staging item path | `op://UBM-Hyogo/Slack Incident Webhook (staging)/url` |
| 1Password staging item timestamp | `<pending>` |
| `cf.sh secret put --env staging` timestamp | `<pending>` |
| `cf.sh secret list --env staging` name-only excerpt | `<pending: SLACK_WEBHOOK_INCIDENT>` |
| redaction quick-check | `<pending: 0 hit>` |

Only non-secret facts may be recorded here after execution.
