# manual-smoke-log

## NON_VISUAL boundary

This workflow has `visualEvidence: NON_VISUAL`; no browser or screenshot smoke is required.

## Local evidence captured

- `vitest-sync-jobs-schema.log`: `@ubm-hyogo/api` test run completed, 104 files / 647 tests PASS.
- `typecheck.log`: `mise exec -- pnpm typecheck` completed with exit 0.
- `lint.log`: `mise exec -- pnpm lint` completed with exit 0. `lint-stablekey-literal` reported existing warning-mode violations and did not fail the command.
- `indexes-rebuild.log`: `mise exec -- pnpm indexes:rebuild` completed.
- `indexes-drift.log`: generated index diff is included in this PR scope.

