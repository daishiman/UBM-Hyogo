# Phase 5: Implementation Runbook

## Steps

1. Re-discover current `apps/api` scripts, tsconfig files, Vitest config, and fixture/test paths.
2. Add `tsconfig.build.json` or an equivalent build-only exclude.
3. Keep Vitest include/exclude explicit so test-only files remain available to tests.
4. Add a dependency boundary rule that blocks production source imports from `__fixtures__` and `__tests__`.
5. Run focused build/test/static checks and save logs under `outputs/phase-11/`.
6. Update 02c invariant #6 documentation and aiworkflow indexes in Phase 12.

## Commands to resolve at execution time

```bash
pnpm --filter apps/api build
pnpm --filter apps/api test:run
pnpm lint:boundaries
```

If command names differ, Phase 11 must record the actual repository scripts used.

## Completion

Runbook is ready for a later implementation wave and does not execute code changes in this spec-created wave.
