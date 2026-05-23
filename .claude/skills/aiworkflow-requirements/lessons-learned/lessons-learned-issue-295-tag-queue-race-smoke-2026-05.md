# Lessons Learned: Issue #295 Tag Queue Race Smoke

## L-295-001: Smoke fixture SQL must be checked against migrations

The initial runbook used stale columns (`id`, `candidate_payload`, `target`). Current schema requires `queue_id`, `response_id`, `suggested_tags_json`, `target_type`, and `target_id`.

## L-295-002: Local smoke helpers should expose pure analysis mode

`--analyze-only` makes race result classification testable without staging credentials.

## L-295-003: Runtime pending is the correct boundary for operator-only staging evidence

Local implementation can be complete while staging D1 fixture creation and admin cookie use remain user-operated. Mark the workflow `implemented_local_evidence_captured` with Phase 11 `runtime_pending`, not `completed`.

## L-295-004: Race smoke pass must not be HTTP-only when AC includes D1 side effects

The runner must fail when side-effect deltas disagree with the Phase 11 before/after SQL summary. `--side-effect-input` keeps AC-4 in the same verdict path without giving the runner direct D1 credentials.

## L-295-005: Non-race concurrency is usage error

`concurrency < 2` cannot exercise a race. Returning exit 0 makes wrapper scripts treat a non-executed smoke as success, so the runner exits 2 before making requests.
