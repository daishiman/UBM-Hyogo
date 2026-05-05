# Phase 4: test strategy

## Strategy

Use the existing `schemaDiffQueue.test.ts` 7-case contract as the proof artifact. Do not weaken assertions and do not add speculative tests.

## Focused Command

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/repository/schemaDiffQueue.test.ts
```

## Notes

`pnpm --filter @ubm-hyogo/api test -- <file>` is not used as evidence because the package script already appends `apps/api`, causing broader execution than intended.
