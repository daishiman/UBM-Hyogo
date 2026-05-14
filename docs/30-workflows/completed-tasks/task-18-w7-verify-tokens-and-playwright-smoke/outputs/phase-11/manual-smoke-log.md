# Phase 11 Manual Smoke Log

## Status

PARTIAL - implemented_local_runtime_pending; browser runtime blocked by local ENOSPC.

## Planned Commands

- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts`
- `mise exec -- pnpm --filter @ubm-hyogo/web build`
- `mise exec -- pnpm verify:tokens`
- `mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke`
- `mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual`

## Evidence Rule

Actual execution output must be saved under `outputs/phase-11/evidence/*.txt`.
