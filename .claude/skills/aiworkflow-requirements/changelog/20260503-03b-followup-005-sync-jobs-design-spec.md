# 2026-05-03 03b-followup-005 sync jobs design spec

## Summary

Synchronized 03b-followup-005 sync jobs design spec into the aiworkflow-requirements skill. The spec establishes a dual-canonical model for `sync_jobs`: a human-readable logical SSOT in `docs/30-workflows/_design/sync-jobs-spec.md` and a TypeScript runtime SSOT in `apps/api/src/jobs/_shared/sync-jobs-schema.ts`. Existing consumers were switched over to the TS SSOT. Issue #198 closed.

## Updated Canonical References

- `references/database-schema.md` (sync_jobs section now links `_design/sync-jobs-spec.md` and TS SSOT, documents PII guard applied at both write and read)
- `references/task-workflow-active.md` (03b-followup-005 marked completed, follow-up candidates noted)
- `references/lessons-learned-03b-followup-005-sync-jobs-design-spec-2026-05.md` (new, 5 lessons)
- `references/workflow-task-03b-followup-005-sync-jobs-design-spec-artifact-inventory.md` (new)
- `indexes/quick-reference.md`, `indexes/resource-map.md`, `indexes/topic-map.md`, `indexes/keywords.json`

## Implementation Artifacts

- `docs/30-workflows/_design/sync-jobs-spec.md` (logical SSOT)
- `apps/api/src/jobs/_shared/sync-jobs-schema.ts` (TS SSOT: `SYNC_JOB_TYPES`, `SYNC_LOCK_TTL_MS`, `SyncJobMetricsZ`, `parseMetricsJson`, `assertNoPii`)
- `apps/api/src/jobs/cursor-store.ts` (switched to TS SSOT)
- `apps/api/src/jobs/sync-forms-responses.ts` (uses `SYNC_JOB_TYPES.RESPONSE_SYNC` constant)
- `apps/api/src/repository/syncJobs.ts` (PII guard at write, TS SSOT references)
- `apps/api/src/repository/__tests__/syncJobs.test.ts` (covers `parseMetricsJson` / `assertNoPii` / lock TTL)
- `apps/api/src/jobs/__fixtures__/d1-fake.ts` (schema-aligned fixture)

## Design Decisions Recorded

- Dual-canonical drift defense: cross-reference grep (`rg "_design/sync-jobs-spec"`) + vitest schema test
- PII guard applied at both `succeed()` / `fail()` write and `parseMetricsJson` read paths
- `SYNC_LOCK_TTL_MS = 10min` justified by inequality: typical exec time < TTL < cron cycle (15min)
- Physical D1 migration deferred to a separate follow-up task (not in this spec scope)
- `job_type` literal lint enforcement deferred to a separate follow-up task

## Deferred / Follow-up

- sync_jobs physical migration follow-up (unassigned-task candidate)
- sync_jobs `job_type` literal lint enforcement follow-up (reuse 03a-stablekey-literal-lint-enforcement standalone Node script approach)

No runtime production mutation was executed. spec_completed / verified / Issue #198 CLOSED.
