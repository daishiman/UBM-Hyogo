# Phase 1: baseline evidence

## Result

The reported Issue #379 failure is not reproducible in the current worktree.

## Command

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/repository/schemaDiffQueue.test.ts
```

## Evidence

`outputs/phase-1/baseline.txt` records:

- Test Files: 1 passed
- Tests: 7 passed
- Failures: 0

## Classification

| Item | Value |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | current GREEN / no code change required |
| stale assumption | "list 系 2 件 fail" |

## DoD

- [x] focused baseline evidence exists
- [x] baseline shows 7/7 PASS
- [x] old fail premise is classified as stale
