# Contract Evidence

Status: PASS

Executed on: 2026-05-01

## Confirmed Contract Checks

- `POST /admin/schema/aliases` path remains unchanged.
- apply mode writes `schema_aliases` and resolves `schema_diff_queue`.
- dry-run mode has no write side effects.
- 03a sync uses `schema_aliases` first and only falls back to `schema_questions.stable_key` on alias miss.
- Shared schema exposes `SchemaAlias` and `SchemaAliasZ`.

## Evidence

- `apps/api/src/routes/admin/schema.test.ts`: route path, query/body dryRun, collision handling.
- `apps/api/src/workflows/schemaAliasAssign.test.ts`: apply, idempotent apply, backfill resume, deleted response skip.
- `apps/api/src/sync/schema/resolve-stable-key.test.ts`: alias-first lookup and fallback-only-on-miss behavior.
- `packages/shared/src/zod/index.test.ts`: shared Zod barrel export.
