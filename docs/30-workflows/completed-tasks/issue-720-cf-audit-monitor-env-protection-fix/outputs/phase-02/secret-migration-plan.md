# Secret migration plan

## Boundary

This plan documents repository-level duplication required after removing `environment: production`.
It does not execute any mutation. `gh secret set` and `gh variable set` require explicit user approval.
Only read-only monitor tokens and approved notification webhooks may be mirrored. Credentials
capable of deploy, rollback, schema apply, branch protection mutation, or broad Cloudflare
mutation remain environment-scoped.

## Repository secrets to mirror

| Name | Current workflow use | Source of truth | Execution |
| --- | --- | --- | --- |
| `CF_AUDIT_D1_TOKEN_PROD` | D1 access token | 1Password production item | user-gated |
| `CF_AUDIT_TOKEN_PROD` | Cloudflare Audit Logs read token | 1Password production item | user-gated |
| `CF_AUDIT_WORKERS_AI_TOKEN` | Workers AI classifier token | 1Password production item | user-gated |
| `SLACK_WEBHOOK_INCIDENT` | Incident Slack webhook | 1Password production item | user-gated |
| `EMAIL_WEBHOOK_URL` | Incident mail webhook | 1Password production item | user-gated |

## Repository variables to mirror

`CF_AUDIT_CLASSIFIER`, `ML_MODEL_PATH`, `CF_AUDIT_IF_MODEL`, `CF_AUDIT_XGB_MODEL`,
`CF_AUDIT_WORKERS_AI_URL`, `CLOUDFLARE_ACCOUNT_ID`, `CF_AUDIT_CLASSIFIER_VERSION`,
`EMAIL_FROM`, and `EMAIL_TO`.

Values must match the production environment values. Secret values must never be written to docs,
logs, shell history, or evidence files.

## Order

1. User mirrors secrets and variables.
2. User or operator confirms names exist via `gh secret list` and `gh variable list`.
3. Workflow YAML diff is pushed and reviewed.
4. Runtime dry run and six scheduled successes are collected.
