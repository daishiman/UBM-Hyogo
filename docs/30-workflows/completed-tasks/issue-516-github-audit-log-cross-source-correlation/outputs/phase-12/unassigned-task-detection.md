# Unassigned Task Detection

## Summary

3 follow-ups are valid because they require external permission, user-gated repository settings, or a separate live endpoint design that would break Issue #516 fixture-only MVP scope.

| ID | Title | Reason | Timing | Location |
| --- | --- | --- | --- | --- |
| U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01 | Live audit-correlation endpoint | Requires production GitHub audit log credential and Cloudflare Worker/API route design | After Issue #516 fixture verify merges | `docs/30-workflows/unassigned-task/` |
| U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-02 | Branch protection required check | Requires GitHub branch protection setting mutation | After CI workflow has empirical green run | `docs/30-workflows/unassigned-task/` |
| U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03 | Salt rotation automation | Requires operational policy and secret rotation approval | After first live wiring design | `docs/30-workflows/unassigned-task/` |

These are not backlog deferrals for convenience. They are separated because the current task explicitly excludes live credential mutation and repository settings mutation.
