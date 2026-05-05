# Runbook

1. `rg --files | rg 'eslint|lint'` to discover current lint topology.
2. Implement rule in the existing lint owner package or config location.
3. Add RuleTester cases matching `outputs/phase-04/test-matrix.md`.
4. Run `mise exec -- pnpm typecheck`, `mise exec -- pnpm lint`, and focused rule tests.
5. Store logs under `outputs/phase-11/`.

No commit, push, or PR is allowed without explicit user approval in Phase 13.
