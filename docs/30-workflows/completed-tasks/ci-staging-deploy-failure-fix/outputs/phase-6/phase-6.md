# Phase 6: Test additions

Added `apps/web/src/lib/__tests__/build-time-env.spec.ts`.

The test calls `getPublicEnv(rawEnv)` and `getEnv(rawEnv)` with explicit objects instead of mutating `process.env`, so it remains deterministic under parallel Vitest execution.

