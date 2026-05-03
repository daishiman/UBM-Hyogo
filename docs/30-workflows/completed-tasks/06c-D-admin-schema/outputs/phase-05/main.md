# Phase 5 Output: Implementation Runbook

Status: SPEC_CREATED_BOUNDARY

Implementation must reuse current owners:

- `apps/web/app/(admin)/admin/schema/page.tsx`
- `apps/api/src/routes/admin/schema.ts`
- `apps/api/src/routes/admin/sync-schema.ts`
- `apps/api/src/repository/schemaAliases.ts`
- `apps/api/src/workflows/schemaAliasAssign.ts`

Do not add a new D1 migration for `schema_aliases`; the table is already owned by issue-191 / UT-07B hardening.
