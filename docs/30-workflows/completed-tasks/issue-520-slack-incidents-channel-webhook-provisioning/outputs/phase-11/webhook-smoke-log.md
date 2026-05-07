# Webhook Smoke Log

Status: PENDING_RUNTIME_EVIDENCE

| Gate | State | Evidence |
| --- | --- | --- |
| G3 | pending_user_approval | Production secret and staging smoke gate not executed |
| G4 | pending_user_approval | Production smoke and redaction evidence not executed |

## G3: Cloudflare Production Secret + Staging Smoke PASS

| Field | Value |
| --- | --- |
| prerequisite | G1 / G2 PASS |
| user approval timestamp | `<pending>` |
| approver | `<pending>` |
| `cf.sh secret put --env production` timestamp | `<pending>` |
| `cf.sh secret list --env production` name-only excerpt | `<pending: SLACK_WEBHOOK_INCIDENT>` |
| `gh secret set` timestamp | `<pending or N/A if CI smoke does not require it>` |
| `gh secret list` name-only excerpt | `<pending or N/A>` |
| staging POST timestamp | `<pending>` |
| staging response status | `<pending>` |
| Slack message prefix | `[STAGING SMOKE]` |
| Slack permalink | `<redacted T*/C*/p* form only>` |
| AC-5 PASS | `<pending>` |

## G4: Production Smoke + Redaction Grep Gate

| Field | Value |
| --- | --- |
| user approval timestamp | `<pending>` |
| approver | `<pending>` |
| production POST timestamp | `<pending>` |
| production response status | `<pending>` |
| Slack message prefix | `[PRODUCTION SMOKE]` |
| Slack permalink | `<redacted T*/C*/p* form only>` |
| `hooks.slack.com/services` hit count | `<pending: 0>` |
| `B-id/token` hit count | `<pending: 0>` |
| `xox[bp]-` hit count | `<pending: 0>` |
| workspace fragment hit count | `<pending: 0>` |
| AC-6 PASS | `<pending>` |
| AC-7 PASS | `<pending>` |

Store status codes, smoke prefixes, timestamps, and redacted channel identifiers only.
