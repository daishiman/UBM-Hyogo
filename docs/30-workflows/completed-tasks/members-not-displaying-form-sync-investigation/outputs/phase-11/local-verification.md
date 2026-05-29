# Phase 11 Local Verification

Date: 2026-05-28

## Scope

Local verification covers the API/code changes for:

- diagnostics snapshot extension
- `GET /admin/sync/diagnostics/forms-pipeline`
- auto-publish-on-consent policy integration
- `POST /admin/sync/backfill-publish-state`
- ops shell script syntax

No web UI code changed in this cycle. Browser screenshots for staging `/members` remain Gate-C because they require staging deploy and runtime data operations.

## Passed Commands

```bash
pnpm --filter @ubm-hyogo/api typecheck
```

Result: PASS (`tsc -p tsconfig.json --noEmit`)

```bash
pnpm --filter @ubm-hyogo/api build
```

Result: PASS (`tsc -p tsconfig.build.json --noEmit`)

```bash
bash -n scripts/diagnose-members-pipeline.sh scripts/backfill-publish-state.sh
```

Result: PASS

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/diagnostics/forms-pipeline.spec.ts \
  apps/api/src/diagnostics/forms-pipeline.contract.spec.ts \
  apps/api/src/lib/policies/auto-publish.spec.ts \
  apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts
```

Result: PASS

- Test Files: 4 passed
- Tests: 31 passed

```bash
pnpm exec vitest run --root=. --config=vitest.d1.config.ts --maxWorkers=1 --minWorkers=1 \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts \
  apps/api/src/routes/admin/sync-diagnostics.contract.spec.ts
```

Result: PASS

- Test Files: 2 passed
- Tests: 22 passed

## Non-blocking Observation

`pnpm --filter @ubm-hyogo/api test -- forms-pipeline auto-publish sync-forms-responses.contract sync-backfill-publish-state sync-diagnostics` expanded to the API-wide unit config and pulled unrelated D1 suites. That run failed with existing D1 hook timeouts in unrelated files, including schema alias, audit log export, dashboard byZone, and attendance bulk import tests. The focused verification above uses the repository's intended unit/D1 split and passed.
