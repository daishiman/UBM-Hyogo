# Workflow Artifact Inventory — issue-837-schema-alias-bulk-rollback

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/issue-837-schema-alias-bulk-rollback/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / runtime_screenshot_pending_user_gate` |
| source | Issue #837 CLOSED / `docs/30-workflows/unassigned-task/serial-05-step-03-followup-006-schema-alias-bulk-rollback.md` consumed |
| parent | `docs/30-workflows/issue-778-schema-alias-rollback-undo/` |
| template | `docs/30-workflows/completed-tasks/issue-776-schema-alias-bulk-resolve/` |

## Implementation Targets

| Path | Role |
| --- | --- |
| `apps/web/src/lib/admin/api.ts` | `rollbackSchemaAliasBulk` client-side bounded fan-out helper |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | HistoryPane bulk rollback mode |
| `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx` | confirm / row result modal |
| `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts` | selection / submit / partial failure state |

## Evidence

| Path | Status |
| --- | --- |
| `docs/30-workflows/issue-837-schema-alias-bulk-rollback/outputs/phase-11/typecheck-local.txt` | present |
| `docs/30-workflows/issue-837-schema-alias-bulk-rollback/outputs/phase-11/focused-vitest-local.txt` | present |
| runtime screenshots | pending user gate |

## Contract

- No new API endpoint.
- No D1 schema change.
- Uses existing `POST /admin/schema/aliases/:aliasId/rollback` per alias with `If-Match: version=<N>`.
- Fan-out concurrency is 8 and UI selection cap is 50.
- Audit remains per-alias `schema_alias.rollback`.
