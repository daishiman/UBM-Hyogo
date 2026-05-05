# Phase 12 Documentation Changelog

| File | Change |
| --- | --- |
| `index.md` | Reframed FU-04 from duplicate apply execution to already-applied verification. |
| `artifacts.json` / `outputs/artifacts.json` | Synced metadata and Phase 12 strict output names. |
| `outputs/phase-11/*` | Materialized runtime evidence placeholders and duplicate apply prohibition evidence. |
| `outputs/phase-12/*` | Materialized strict 7 Phase 12 files. |
| `task-workflow-active.md` | Added FU-04 entry. |
| `quick-reference.md` / `resource-map.md` | Added FU-04 reverse lookup. |
| `scripts/d1/preflight.sh` | Added `--expect pending|applied` so FU-03 apply workflows and FU-04 already-applied verification can share the script without inverting PASS/FAIL; also stops broad `d1 migrations apply` when target-external pending migrations are present. |
| `scripts/d1/postcheck.sh` | Limited hardening post-check to `schema_diff_queue.backfill_cursor` / `backfill_status`; `schema_aliases` objects belong to `0008_create_schema_aliases.sql`. |
| `task-ut-07b-fu-04-production-migration-apply-execution.md` | Marked stale apply instruction as consumed by current already-applied verification workflow. |
| `workflow-ut-07b-fu-04-production-migration-apply-execution-artifact-inventory.md` | Added dedicated FU-04 artifact inventory. |
| `task-specification-creator` skill | Promoted already-applied verification rule and changelog entry. |
