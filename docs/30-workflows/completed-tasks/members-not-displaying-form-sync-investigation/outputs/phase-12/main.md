# Phase 12 Main

## Summary

`members-not-displaying-form-sync-investigation` is now locally implemented and runtime-pending. This improvement cycle completed the API/script implementation, focused local verification, strict Phase 12 outputs, and aiworkflow-requirements ledger sync.

## Scope Boundary

No commit, PR, staging deploy, staging D1 mutation, or browser smoke was executed. Those actions remain user-gated and are tracked in `artifacts.json` Gate-C/Phase 13.

## Corrected Decisions

- Existing diagnostics schema is `apps/api/src/diagnostics/schema.ts`, not a new `forms-pipeline.schema.ts`.
- Existing diagnosis keys are `hypothesisFlags.H2_identityMismatchSuspected` and `hypothesisFlags.H4_aliasPendingNonZero`.
- Canonical publish state is `public | member_only | hidden`; legacy `published/private` is diagnostic-only compatibility.
- `member_status_history` does not exist; override detection uses `member_status.updated_by` and `publish_state='hidden'`.
- CLI diagnostics use a new sync-token endpoint instead of the human-admin JWT diagnostics route.
- Focused verification must use both unit and D1 Vitest configs; running API-wide tests through the unit config can pull unrelated D1 suites and hit hook timeouts.
