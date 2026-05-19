# Phase 13 PR summary — parallel-i06-root-error-focus

Commit, push, and PR creation are blocked pending explicit user approval.

## Proposed Summary

- root `apps/web/app/error.tsx` now focuses the h1 on mount with `preventScroll: true`
- `apps/web/app/error.spec.tsx` verifies focus transfer and digest display
- workflow root now has artifacts parity, Phase 11 evidence, Phase 12 strict 7, and aiworkflow-requirements sync

## Proposed Test Plan

- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/error.spec.tsx`
- grep gates in `outputs/phase-11/evidence/grep-gate.log`
