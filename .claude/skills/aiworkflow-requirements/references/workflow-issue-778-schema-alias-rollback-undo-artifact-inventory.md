# Workflow Artifact Inventory: Issue #778 Schema Alias Rollback / Undo

## Canonical Root

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/issue-778-schema-alias-rollback-undo/` |
| root artifacts | `docs/30-workflows/issue-778-schema-alias-rollback-undo/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/issue-778-schema-alias-rollback-undo/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/issue-778-schema-alias-rollback-undo/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Source And Parent

| Role | Path |
| --- | --- |
| source unassigned task | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md` |
| parent workflow | `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/` |
| existing history follow-up | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md` |
| split follow-up | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md` |
| split follow-up | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-006-schema-alias-bulk-rollback.md` |
| split follow-up | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-007-schema-alias-rollback-notification.md` |

## Contract

- API: `POST /admin/schema/aliases/:aliasId/rollback`
- Optimistic lock: `If-Match: version=<N>`
- Response: `{ aliasId, rolledBackAt, relatedAuditId, newVersion, impact }`
- Audit: application `audit_log.action='schema_alias.rollback'`;元 resolve は rollback 行の `after_json.relatedAuditId`
- D1: `schema_aliases.deleted_at`, `deleted_by`, `version`; unique indexes are partial with `WHERE deleted_at IS NULL`

## Boundary

Implementation, staging D1 migration apply, production D1 migration apply, Playwright visual baseline, commit, push, and PR remain user-gated.
