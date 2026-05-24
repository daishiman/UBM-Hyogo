# 2026-05-24 issue-838-schema-alias-rollback-notification

## Changes

- Registered `docs/30-workflows/issue-838-schema-alias-rollback-notification/` as `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_pending`.
- Added `apps/api/src/workflows/schemaAliasRollbackNotification.ts` (`dispatchSchemaAliasRollbackNotification` with Slack-first + mail fallback best-effort, `buildRollbackNotificationPayload`, `redactRollbackActor`, `recordRollbackNotificationAudit`).
- Wired the `POST /admin/schema/aliases/:aliasId/rollback` route to fire the notification after a successful rollback and record `audit_log.action='schema_alias.rollback_notification'` with `after_json={status,channel,attempts,errorClass,dispatchedAt}`.
- Isolated dispatch and audit recording in separate try/catch blocks so an auxiliary failure never converts a successful rollback into a non-200 response.
- Enforced 3-layer redaction: actor email reduced to `admin:redacted`, stableKey / token / webhook URL excluded from payload and audit, mail HTML escaped inside `<pre>`.
- Canonicalized env names to `SLACK_WEBHOOK_INCIDENT` / `SLACK_WEBHOOK_URL` / `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `OPS_NOTIFICATION_EMAIL` and retired the stale `RESEND_API_KEY` naming for this context.
- Same-wave reflection: `references/api-endpoints.md`, `references/database-implementation-core.md`, `references/task-workflow-active.md`, `indexes/quick-reference.md`, `indexes/resource-map.md`, `indexes/topic-map.md`.
- Added `lessons-learned/lessons-learned-issue-838-schema-alias-rollback-notification-2026-05.md` (L-I838-001..005) and SKILL.md top entry / SKILL-changelog / LOGS.
- Corrected the `phase12-task-spec-compliance-check.md` §3 `in_progress` typo to `runtime_pending`.
- Removed an unassigned-task file created without authorization by a read-only audit subagent to keep `unassigned-tasks-report.md` ("no new unassigned tasks") consistent.

## Verification

- `mise exec -- pnpm verify:phase12-compliance`: PASS
- `mise exec -- pnpm gate-metadata:validate`: PASS (ERROR 0)
- `mise exec -- pnpm indexes:rebuild`: no drift after regeneration
- `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js`: PASS

## User-gated

- staging provider smoke (real Slack/mail dispatch), Cloudflare deploy, staging D1 mutation, commit, push, PR.
