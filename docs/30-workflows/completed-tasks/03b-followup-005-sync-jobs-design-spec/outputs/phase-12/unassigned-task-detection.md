# Unassigned Task Detection

## Result

Detected follow-up tasks: 0

## Rationale

The implementation work is completed in this workflow: create TS runtime SSOT, update consumers, update `_design/sync-jobs-spec.md`, update references, rebuild indexes, and collect NON_VISUAL evidence. `assertNoPii` call-site coverage is not left as a follow-up because `syncJobs.succeed()` now runs `assertNoPii()` before writing `metrics_json`, `syncJobs.toRow` reads through `parseMetricsJson`, and both paths are covered by focused tests.

## Recheck Trigger

If future sync job types add new metrics payloads, update `_design/sync-jobs-spec.md` and `apps/api/src/jobs/_shared/sync-jobs-schema.ts` in the same wave.
