# Phase 2: Design

## Design decision

Use a three-layer guard:

| Layer | Purpose | Candidate implementation |
| --- | --- | --- |
| Build input boundary | keep test-only files out of build compilation | `apps/api/tsconfig.build.json` or build-specific exclude |
| Test input boundary | keep Vitest fixture loading explicit | `apps/api/vitest.config.ts` include/exclude |
| Import boundary | prevent runtime source from importing test-only paths | `.dependency-cruiser.cjs` rule |

## Repository layout discovery required before implementation

Implementation must re-discover actual files and scripts with:

```bash
rg --files apps/api | rg '(__fixtures__|__tests__|tsconfig|vitest|wrangler|package.json)'
pnpm --filter apps/api exec tsc --showConfig
```

Do not assume `wrangler` consumes TypeScript config directly. Bundle evidence is the source of truth.

## Evidence contract

| Evidence | Meaning |
| --- | --- |
| `build-artifact-grep.log` | artifact listing and grep prove zero fixture/test path inclusion |
| `vitest-focused.log` | fixture loader remains usable |
| `dependency-boundary.log` | static rule rejects production imports |
| `regression-scope.log` | affected 02a / 02b / 02c tests identified and run or explicitly deferred |

## Completion

The design keeps runtime safety and test ergonomics independent instead of using one broad exclude as the only guard.
