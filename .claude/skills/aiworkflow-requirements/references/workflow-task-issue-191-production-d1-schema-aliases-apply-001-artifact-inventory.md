# Artifact Inventory: task-issue-191 production D1 schema_aliases apply

## Metadata

| Field | Value |
| --- | --- |
| Workflow | `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/` |
| State | `spec_created / implementation / NON_VISUAL / production-operation / Phase 13 blocked_until_user_approval` |
| Sync date | 2026-05-02 |
| Canonical spec | `references/database-schema.md` |

## Current Canonical Set

| Artifact | Role |
| --- | --- |
| `index.md` | workflow summary and operation boundary |
| `artifacts.json` / `outputs/artifacts.json` | phase ledger parity source |
| `phase-04.md` | static / DDL / production verification strategy with target-only pending migration NO-GO |
| `phase-06.md` | E-1〜E-9 exception and rollback approval boundary |
| `phase-10.md` | Design GO / Runtime GO separation |
| `phase-11.md` / `outputs/phase-11/*` | NON_VISUAL pre-apply evidence and Phase 13 evidence reservation |
| `outputs/phase-12/implementation-guide.md` | Phase 12 human + technical guide |
| `outputs/phase-12/system-spec-update-summary.md` | same-wave SSOT sync summary |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 final compliance evidence |
| `outputs/phase-13/main.md` | blocked_until_user_approval Phase 13 index |

## Source / Follow-Up State

| Task | Status |
| --- | --- |
| `docs/30-workflows/unassigned-task/task-issue-191-production-d1-schema-aliases-apply-001.md` | transferred_to_workflow |
| `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` | remains blocked by production apply completion |
| `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md` | remains blocked by production apply completion |

## Runtime Evidence Reservation

Phase 13 runtime evidence is intentionally absent until explicit user approval:

- `outputs/phase-13/user-approval.md`
- `outputs/phase-13/migrations-list-before.txt`
- `outputs/phase-13/tables-before.txt`
- `outputs/phase-13/migrations-apply.log`
- `outputs/phase-13/pragma-table-info.txt`
- `outputs/phase-13/pragma-index-list.txt`
- `outputs/phase-13/migrations-list-after.txt`
