# Runtime Pending Evidence — ci-dry-run.md

## Required Evidence

- PR-A branch name
- `cf-audit-log-7day-summary.yml` workflow_dispatch run URL
- `recovery_mode=true`
- `since=<D'+0 ISO8601 UTC>`
- validate-input step conclusion

## Boundary

Workflow dispatch is user-gated and must not be executed by this review cycle.
