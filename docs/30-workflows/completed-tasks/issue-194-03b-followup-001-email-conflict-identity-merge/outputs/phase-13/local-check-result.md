# Phase 13 Local Check Result

## Status

- State: `PENDING_USER_APPROVAL`
- Purpose: Phase 13 declared output. ローカル静的検証 / focused test の実測値を記録する。
- Boundary: commit / push / PR / deploy / staging migration apply は未実行。

## Planned Local Checks

| Check | Command | Current result |
| --- | --- | --- |
| api typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS (exit 0) |
| shared typecheck | `mise exec -- pnpm --filter @ubm-hyogo/shared typecheck` | PASS (exit 0) |
| focused api tests | `mise exec -- pnpm exec vitest run --config=vitest.config.ts apps/api/src/services/admin/identity-conflict-detector.test.ts apps/api/src/repository/__tests__/identity-conflict.test.ts apps/api/src/repository/__tests__/identity-merge.test.ts` | PASS: 3 files / 16 tests |
| broad api test attempt | `mise exec -- pnpm --filter @ubm-hyogo/api test -- identity-conflict identity-merge identity-conflict-detector` | FAIL due broad Vitest selection: unrelated existing timeouts in `apps/api/src/routes/admin/audit.test.ts` and `apps/api/src/sync/schema/forms-schema-sync.test.ts`; focused identity tests passed |
