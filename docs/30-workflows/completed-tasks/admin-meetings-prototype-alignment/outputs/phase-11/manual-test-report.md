# Manual Test Report

## Summary

This report records the planned manual test set for the implementation PR. No runtime UI claim is made in this spec-created cycle.

## Required Commands After Implementation

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- _meetings
mise exec -- pnpm --filter @ubm-hyogo/web test -- meetings/\\[id\\]
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## Verdict

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`: the evidence contract is complete and runtime capture is pending.
