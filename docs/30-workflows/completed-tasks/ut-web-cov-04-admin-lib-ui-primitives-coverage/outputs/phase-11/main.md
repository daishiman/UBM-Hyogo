# outputs phase 11: ut-web-cov-04-admin-lib-ui-primitives-coverage

- status: completed
- purpose: 手動 smoke / 実測 evidence
- evidence:
  - `mise exec -- pnpm --filter @ubm-hyogo/web test` -> PASS (44 files / 322 tests)
  - `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` -> PASS (44 files / 322 tests)
  - `apps/web/coverage/coverage-summary.json` -> captured after coverage run
  - `outputs/phase-11/coverage-after.json` and `coverage-diff.md` -> populated from measured coverage
- note: NON_VISUAL task. Screenshot evidence is not required because production UI code was not changed.
