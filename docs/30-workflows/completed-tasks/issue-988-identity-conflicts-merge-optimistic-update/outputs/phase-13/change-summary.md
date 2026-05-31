# Phase 13: change summary

- `IdentityConflictRow.tsx`: added component-local `optimisticMerged` state, immediate hide on merge submit, rollback on rejected mutation.
- `IdentityConflictRow.spec.tsx`: added optimistic hide, success-stays-hidden, rollback evidence while preserving dismiss tests.
- `admin-identity-conflicts.spec.ts`: added Playwright scenarios for optimistic hide and rollback.
- Workflow docs: reclassified from `spec_created` to `implemented_local_evidence_captured`; visual screenshots captured locally in Phase 11.
