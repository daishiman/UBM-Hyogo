# outputs phase 11: ut-web-cov-01-admin-components-coverage

- status: completed
- purpose: 手動 smoke / 実測 evidence
- evidence: `pnpm --filter @ubm-hyogo/web test:coverage`
- result: PASS (21 test files / 196 tests)
- coverage artifacts:
  - `outputs/phase-11/vitest-run.log`
  - `outputs/phase-11/coverage-summary.snapshot.json`
  - `outputs/phase-11/coverage-target-files.txt`
- target coverage result: all 7 target files PASS Stmts/Lines/Funcs >=85% and Branches >=80%.
- runtime note: Node 24.x is required by `package.json`; local execution used Node v22.21.1 and emitted an engine warning, but Vitest completed successfully.
- visual evidence: NON_VISUAL test coverage task, screenshot not required.
