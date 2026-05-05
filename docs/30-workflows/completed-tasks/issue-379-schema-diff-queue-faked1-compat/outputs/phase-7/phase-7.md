# Phase 7: coverage snapshot

## Command

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --coverage --coverage.reporter=json-summary --coverage.reportsDirectory=apps/api/coverage --coverage.include='apps/api/src/repository/schemaDiffQueue.ts' apps/api/src/repository/schemaDiffQueue.test.ts
```

## Evidence

`outputs/phase-7/coverage-summary-snapshot.json` exists.

## Focused Result

The focused run passed 1 file / 7 tests. Coverage is captured as a snapshot for traceability, not as a new threshold gate.
