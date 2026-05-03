# Implementation Guide

## Part 1: Middle School Level

This task is like checking one new labeled box on a school library shelf after the teacher approved the work. The box design was already prepared. When we checked the real library, the box was already there, so we did not add a second box. Instead, we checked the box shape and wrote down the proof.

Why this matters: the real library is used by everyone. If we add the same box twice or run the wrong command, people can get confused. So the final order was: get approval, check the real shelf, skip duplicate apply, verify the box shape, and write down the result.

| Term | Plain wording |
| --- | --- |
| D1 | the real data shelf |
| migration | the instruction sheet for adding the box |
| schema_aliases | the new box name |
| PRAGMA | a photo/check of the box shape |
| production | the real place everyone uses |

Middle school self-check:

- The real database was not changed before approval.
- The command must point at the API config file.
- The final check is a real production PRAGMA photo, not just the design sheet.
- Because the box already existed with the correct ledger entry, adding it again was correctly skipped.

## Part 2: Technical Details

- Target database: `ubm-hyogo-db-prod`
- Environment: `production`
- Migration: `apps/api/migrations/0008_create_schema_aliases.sql`
- Apply command prepared but **not executed** because production D1 already had `0008_create_schema_aliases.sql` recorded in `d1_migrations`.
- Pre evidence: migration list and table inventory.
- Post evidence: `PRAGMA table_info(schema_aliases)`, `PRAGMA index_list(schema_aliases)`, and migration list.
- Approval: recorded before production remote checks.
- Rollback: destructive DDL is reference-only until additional explicit approval.

### Required Shape

| Object | Required contract |
| --- | --- |
| Table | `schema_aliases` |
| Columns | `id`, `revision_id`, `stable_key`, `alias_question_id`, `alias_label`, `source`, `created_at`, `resolved_by`, `resolved_at` |
| Indexes | `idx_schema_aliases_stable_key`, `idx_schema_aliases_revision_stablekey_unique`, `idx_schema_aliases_revision_question_unique` |
| Config | `apps/api/wrangler.toml` via `--config apps/api/wrangler.toml` |

### Error And Edge Cases

| Case | Handling |
| --- | --- |
| Cloudflare auth fails | stop before apply; fix auth and retry only after approval remains valid |
| `schema_aliases` already exists | stop; report state instead of applying |
| target is not the only pending migration | stop with NO-GO; do not apply unrelated migrations |
| PRAGMA shape mismatch | stop; present rollback DDL for separate approval |
| push / PR requested implicitly | stop; push / PR needs separate explicit approval |

## Evidence References

Phase 11 is NON_VISUAL and does not require screenshots because this workflow changes no UI surface. The pre-apply evidence set is:

- `../phase-11/main.md`
- `../phase-11/static-checks.md`
- `../phase-11/local-pragma-evidence.md`
- `../phase-11/typecheck-lint.md`
- `../phase-11/cli-wrapper-grep.md`
- `../phase-11/env-binding-evidence.md`
- `../phase-11/production-apply-readiness.md`
- `../phase-11/manual-smoke-log.md`

Phase 13 runtime evidence was captured after explicit user approval under `../phase-13/`:

- `../phase-13/user-approval.md`
- `../phase-13/migrations-list-before.txt`
- `../phase-13/tables-before.txt`
- `../phase-13/d1-migrations-table.txt`
- `../phase-13/pragma-table-info.txt`
- `../phase-13/pragma-index-list.txt`
- `../phase-13/migrations-list-after.txt`

No screenshots are required for this NON_VISUAL production operation.
