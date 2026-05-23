# Skill Feedback Report

## Template Improvements

- No new template change required.

## Workflow Improvements

- Phase 11 SQL must be checked against migration files before close-out; this workflow corrected stale `id` / `target` column usage to `queue_id` / `target_type` / `target_id`.
- Runtime-pending consumed tasks should keep `runtime_pending` visible in the consumed status to avoid hiding operator evidence that is still required.
- Race smoke runners should treat `concurrency < 2` as usage error and expose side-effect summary validation when an AC depends on database deltas.

## Documentation Improvements

- Keep `implementation` workflows out of `spec_created` once scripts and tests are added in the same wave.
- Phase 13 draft bodies must not claim runtime PASS while Phase 11 is `runtime_pending`.
