# Implementation Guide

## Part 1: Middle School Level

This task is like adding one new labeled box to a school library shelf. The box design is already prepared, but we do not place it in the real library until the teacher says yes. For example, we first check that only this one box is waiting to be added. If another box is also waiting, we stop and ask again instead of adding both by accident.

Why this matters: the real library is used by everyone. If we place the box at the wrong time, people can get confused. So the order is: get approval, place the box, check that it is there, and write down the result.

| Term | Plain wording |
| --- | --- |
| D1 | the real data shelf |
| migration | the instruction sheet for adding the box |
| schema_aliases | the new box name |
| PRAGMA | a photo/check of the box shape |
| production | the real place everyone uses |

Middle school self-check:

- The real database is not changed before approval.
- The command must point at the API config file.
- The final check is a real production PRAGMA photo, not just the design sheet.

## Part 2: Technical Details

- Target database: `ubm-hyogo-db-prod`
- Environment: `production`
- Migration: `apps/api/migrations/0008_create_schema_aliases.sql`
- Apply command: `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production`
- Pre evidence: migration list and table inventory.
- Post evidence: `PRAGMA table_info(schema_aliases)`, `PRAGMA index_list(schema_aliases)`, and migration list.
- Approval: required before any production write.
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

Phase 13 runtime evidence is reserved for explicit user approval and will be written under `../phase-13/`.
