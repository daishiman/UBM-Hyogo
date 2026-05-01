# Phase 4: Test Strategy

## Test matrix

| Area | Command shape | Required result |
| --- | --- | --- |
| Build artifact absence | `pnpm --filter apps/api build` plus artifact listing/grep | no `__fixtures__` or `__tests__` paths |
| TypeScript build scope | `tsc --listFiles -p apps/api/tsconfig.build.json` | test-only files absent |
| Vitest fixture compatibility | focused repository tests | tests pass |
| Import boundary | dependency-cruiser or boundary lint | production import violation fails |

## Negative test

If feasible, add or document a temporary violation fixture proving that production code importing `__fixtures__` produces a boundary error. Do not commit temporary violation code.

## Completion

Test strategy covers static and runtime-adjacent evidence without requiring production deploy.
