# PR Template

## Summary

- Add task-03 Sentry Workers SDK unify specification package
- Keep workflow as `implemented-local / implementation / NON_VISUAL`
- Define `SENTRY_DSN_WEB` server secret and `NEXT_PUBLIC_SENTRY_DSN` browser var boundary
- Reserve Phase 11 / 12 / 13 outputs without claiming runtime PASS

## Test Plan

- Validate Phase 1〜13 files
- Validate Phase 12 strict 7 outputs
- Confirm Phase 11 state is `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

## Boundary

Implementation, staging deploy, Sentry dashboard verification, commit, push, and PR creation require explicit user approval.
