# System Spec Update — issue-838-schema-alias-rollback-notification

## Updated Canonical References

| Path | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | Added rollback notification behavior and audit action contract |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | Added application `audit_log` action contract for `schema_alias.rollback_notification` |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added Issue #838 implemented-local runtime-pending workflow entry |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added quick lookup row for rollback notification |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added workflow/resource lookup row |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `keywords.json` | Regenerated after same-wave reference updates |

## Contract Summary

`POST /admin/schema/aliases/:aliasId/rollback` keeps its existing response body and status behavior. On successful rollback, it attempts best-effort operations notification using `SLACK_WEBHOOK_INCIDENT` or `SLACK_WEBHOOK_URL` first, then mail fallback via `MAIL_PROVIDER_KEY`, `MAIL_FROM_ADDRESS`, and `OPS_NOTIFICATION_EMAIL`.

The notification result is recorded as `audit_log.action='schema_alias.rollback_notification'`. This action is auxiliary: failure to dispatch notification or record notification audit must not convert a successful rollback into a non-200 response.

## Environment Contract

| Name | Kind | Purpose |
| --- | --- | --- |
| `SLACK_WEBHOOK_INCIDENT` | Secret | Preferred incident Slack webhook |
| `SLACK_WEBHOOK_URL` | Secret | Legacy fallback Slack webhook |
| `MAIL_PROVIDER_KEY` | Secret | Mail provider API key |
| `MAIL_FROM_ADDRESS` | Variable | Mail sender address |
| `OPS_NOTIFICATION_EMAIL` | Secret or variable | Operations recipient |
