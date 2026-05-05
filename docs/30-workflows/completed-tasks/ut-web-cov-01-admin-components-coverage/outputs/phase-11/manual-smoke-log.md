# Manual Smoke Log: ut-web-cov-01-admin-components-coverage

Status: PASS.

Command:

```bash
pnpm --filter @ubm-hyogo/web test:coverage
```

Result: 21 test files passed, 196 tests passed. Coverage artifacts were saved to `vitest-run.log`, `coverage-summary.snapshot.json`, and `coverage-target-files.txt`.

Runtime note: the command emitted the expected engine warning because this shell is Node v22.21.1 while the repo requests Node 24.x. No test failure occurred.

Visual note: this is a NON_VISUAL unit coverage task. Screenshot evidence is not required.
