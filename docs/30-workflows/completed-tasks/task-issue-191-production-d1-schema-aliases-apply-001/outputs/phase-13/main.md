# Phase 13 Main

Status: **completed_via_already_applied_path** (executed 2026-05-02)

## Summary

Phase 13 production D1 apply was approved by the user on 2026-05-02. Execution discovered that migration `0008_create_schema_aliases.sql` had already been applied to `ubm-hyogo-db-prod` on 2026-05-01 10:59:35 UTC by a prior operation (recorded in the remote `d1_migrations` table). Per the spec NO-GO clause for "schema_aliases already exists", the workflow did not invoke `wrangler d1 migrations apply` and instead executed the shape-verification path. The required shape was confirmed and SSOT (`database-schema.md`) was updated to mark the table `production applied`.

## Gate Status

| Gate | Status | Evidence |
| --- | --- | --- |
| Gate-A: Design GO | passed | Phase 1-12 outputs present |
| Gate-B: Production D1 apply approval | **passed** | `user-approval.md` recorded; user response "y" to pre-apply confirmation |
| Gate-C1: SSOT update | **passed** | `.claude/skills/aiworkflow-requirements/references/database-schema.md` updated to `production applied` with timestamp + evidence path |
| Gate-C2: Commit / push / PR approval | not executed | Commit, push, and PR creation require separate explicit user approval |

## Runtime Evidence (this directory)

| Output | Status |
| --- | --- |
| `user-approval.md` | recorded |
| `migrations-list-before.txt` | captured (`No migrations to apply` on `--remote`) |
| `migrations-list-after.txt` | captured (identical to before — no apply performed) |
| `tables-before.txt` | captured — confirms `schema_aliases` already exists |
| `d1-migrations-table.txt` | captured — confirms `0008_create_schema_aliases.sql` applied 2026-05-01 10:59:35 UTC |
| `migrations-apply.log` | **not produced** (apply skipped per NO-GO) |
| `pragma-table-info.txt` | captured — 9 columns match Required Shape |
| `pragma-index-list.txt` | captured — 3 expected indexes (+ pk autoindex) match Required Shape |

## Shape Verification (vs Phase-12 Required Shape)

| Object | Expected | Observed | Match |
| --- | --- | --- | --- |
| Table | `schema_aliases` | exists | OK |
| Columns | `id`, `revision_id`, `stable_key`, `alias_question_id`, `alias_label`, `source`, `created_at`, `resolved_by`, `resolved_at` | all 9 present | OK |
| Index | `idx_schema_aliases_stable_key` (non-unique) | present, unique=0 | OK |
| Index | `idx_schema_aliases_revision_stablekey_unique` (unique partial) | present, unique=1 | OK |
| Index | `idx_schema_aliases_revision_question_unique` (unique) | present, unique=1 | OK |

## Why apply was skipped (per spec)

`outputs/phase-12/implementation-guide.md` defines:

> | `schema_aliases` already exists | stop; report state instead of applying |

Pre-apply inventory triggered this clause. Skipping the apply is the spec-compliant outcome. The verification path satisfies the task DoD because:

- Production D1 contains the table with the contracted shape.
- `d1_migrations` confirms the migration was applied (so the table's existence is from the intended migration, not a manual creation).
- `database-schema.md` is updated with the production-applied marker and timestamp.

## Boundary

This Phase 13 execution does not authorize:

- code deploy (Worker bundle deploy)
- fallback retirement (#299)
- direct stable_key update guard (#300)
- 07b endpoint path rename
- destructive rollback DDL (would require separate explicit approval)
