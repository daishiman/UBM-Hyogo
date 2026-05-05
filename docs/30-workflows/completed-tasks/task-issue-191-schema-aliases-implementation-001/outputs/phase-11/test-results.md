# Test Results

Status: PASS

Executed on: 2026-05-01

## Commands

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/repository/schemaAliases.test.ts \
  apps/api/src/workflows/schemaAliasAssign.test.ts \
  apps/api/src/routes/admin/schema.test.ts \
  apps/api/src/sync/schema/resolve-stable-key.test.ts \
  apps/api/src/repository/schemaQuestions.test.ts \
  packages/shared/src/zod/index.test.ts

pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/shared typecheck
```

## Results

- Targeted Vitest: 6 files passed, 29 tests passed.
- API typecheck: PASS.
- Shared typecheck: PASS.

## Note

An earlier broad API test invocation accidentally ran the full `apps/api` suite and failed with Miniflare `EADDRNOTAVAIL` port exhaustion plus the pre-patch 120-row backfill timeout. The targeted post-fix suite above is the authoritative evidence for this task.
