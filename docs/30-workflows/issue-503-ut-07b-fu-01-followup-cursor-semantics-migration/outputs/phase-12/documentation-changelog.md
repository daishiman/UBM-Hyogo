# Phase 12 Documentation Changelog

## Status

`implemented-local / runtime evidence pending_user_gate`.

| File | Type | Summary |
| --- | --- | --- |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | Edit | Added `BACKFILL_CURSOR_MODE` branch, removed accidental NUL byte, reset stale cursor when lower remaining rows exist |
| `apps/api/src/routes/admin/schema.ts` | Edit | Pass `BACKFILL_CURSOR_MODE` into initial apply/backfill path |
| `apps/api/src/routes/admin/_shared.ts` | Edit | Added `BACKFILL_CURSOR_MODE` route env binding type |
| `apps/api/src/workflows/schemaAliasAssign.ts` | Edit | Added cursor-mode initial apply helper while keeping public backfill result shape unchanged |
| `apps/api/src/repository/schemaDiffQueue.ts` | Edit | Added cursor read/write helpers using existing `backfill_cursor` column |
| `apps/api/migrations/0015_schema_diff_queue_cursor.sql` | Not created | Create only if cursor is adopted after Phase 11 runtime evidence |
| `apps/api/src/workflows/schemaAliasBackfillBatch.test.ts` | Edit | Added stale-cursor row-skip prevention regression test |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | Edit | Reflected shadow flag boundary and existing-column reuse |
| `.claude/skills/aiworkflow-requirements/references/database-operations.md` | Edit | Reflected A/B procedure and rollback boundary |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | Edit | Regenerated cursor search keys |
| `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` | Edit | Marked formalized/consumed by Issue #503 |
