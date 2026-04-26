# Phase 4 Pre-Validation Procedure

## Commands

```bash
git diff --stat -- docs/05b-parallel-smoke-readiness-and-handoff
rg -n "dev|main|D1|Sheets|1Password" docs/05b-parallel-smoke-readiness-and-handoff
# stale infrastructure task-root path pattern must not appear in current 05b files
```

## Expected Result

The first two commands identify the scoped handoff content. A stale-path search should return no hits in current 05b files.
