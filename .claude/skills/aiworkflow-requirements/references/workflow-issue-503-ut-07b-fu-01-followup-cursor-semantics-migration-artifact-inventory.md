# Issue #503 UT-07B-FU-01 cursor semantics migration artifact inventory

## Status

`implemented-local / implementation / NON_VISUAL / runtime evidence pending_user_gate`

## Workflow

| Item | Value |
| --- | --- |
| Root | `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/` |
| Source unassigned | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` |
| Issue | `Refs #503` |
| Runtime boundary | staging A/B evidence pending user approval |
| Public API | `backfill.status` contract unchanged |

## Implemented files

| Path | Responsibility |
| --- | --- |
| `apps/api/src/env.ts` | Adds `BACKFILL_CURSOR_MODE` binding to API env |
| `apps/api/src/routes/admin/_shared.ts` | Adds admin route env type for `BACKFILL_CURSOR_MODE` |
| `apps/api/src/routes/admin/schema.ts` | Passes cursor mode into initial alias apply/backfill path |
| `apps/api/src/index.ts` | Resolves cursor mode in queue consumer |
| `apps/api/src/repository/schemaDiffQueue.ts` | Reads/writes existing `backfill_cursor` for shadow cursor state |
| `apps/api/src/workflows/schemaAliasAssign.ts` | Adds cursor-mode back-fill path with public result contract unchanged |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | Adds mode branch and stale-cursor reset for row-skip prevention |
| `apps/api/src/workflows/schemaAliasBackfillBatch.test.ts` | Adds cursor mode, fallback, contract, and stale-cursor regression coverage |

## Documentation / evidence

| Path | Role |
| --- | --- |
| `outputs/phase-11/decision-record.md` | Runtime adoption decision placeholder; no PASS until staging evidence |
| `outputs/phase-12/implementation-guide.md` | PR-message source and implementation summary |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 4-condition compliance summary |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | DB contract and migration boundary |
| `.claude/skills/aiworkflow-requirements/references/database-operations.md` | A/B operation and rollback boundary |

## Boundary

`0015_schema_diff_queue_cursor.sql` is intentionally absent. It is created only if Phase 11 staging A/B evidence adopts cursor mode. Until then, the default remains `remaining-scan`.
