# Phase 09 Coverage Summary

## Command

```bash
mise exec -- pnpm vitest run scripts/postmortem --coverage '--coverage.include=scripts/postmortem/**'
```

## Result

PASS.

| File | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `scripts/postmortem/generate-postmortem.ts` | 89.44% | 73.61% | 100% | 89.44% |

AC-10 line 80%+ / branch 60%+ is satisfied for the postmortem generator scope.
