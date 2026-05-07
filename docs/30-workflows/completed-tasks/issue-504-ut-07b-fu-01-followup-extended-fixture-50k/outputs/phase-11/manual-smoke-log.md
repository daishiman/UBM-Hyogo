# Manual Smoke Log

## Local Contract Checks

```bash
pnpm -w exec vitest run scripts/schema-alias-backfill/__tests__/generate-50k-fixture.test.ts
pnpm exec vitest run apps/api/src/routes/admin/schema.test.ts
pnpm schema-alias-backfill:test
bash -n scripts/schema-alias-backfill/seed-staging-50k.sh
bash -n scripts/schema-alias-backfill/cleanup-staging-50k.sh
bash -n scripts/schema-alias-backfill/run-stress-trial.sh
```

## Optional Host Tool Checks

```bash
bats scripts/schema-alias-backfill/__tests__/*.bats
shellcheck scripts/schema-alias-backfill/*.sh
```

`bats` and `shellcheck` are host tools and may be unavailable on a local machine. When absent, the bash syntax checks and focused Vitest/API route tests are the local fallback; CI or an operator machine with those tools should run the optional checks before runtime execution.
