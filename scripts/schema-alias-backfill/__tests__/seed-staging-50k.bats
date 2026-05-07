#!/usr/bin/env bats
# Issue #504: contract tests for seed-staging-50k.sh / cleanup-staging-50k.sh

setup() {
  SCRIPT_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." && pwd)"
  SEED="${SCRIPT_DIR}/seed-staging-50k.sh"
  CLEANUP="${SCRIPT_DIR}/cleanup-staging-50k.sh"
  FIXTURE="$(mktemp)"
  echo "INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, label, suggested_stable_key, status, dedupe_key) VALUES ('fixture-1','rev1','unresolved','q1','Fixture','fixture_field','queued','ubm-test-fixture-50k-0000001-a');" > "${FIXTURE}"
}

teardown() {
  rm -f "${FIXTURE}"
}

# TC-SEED-01
@test "seed --env production aborts before invoking cf.sh" {
  run bash "${SEED}" --env production --fixture-file "${FIXTURE}"
  [ "${status}" -eq 1 ]
  [[ "${output}" == *"production bulk INSERT is permanently banned"* ]]
}

# TC-SEED-02
@test "seed CLOUDFLARE_ENV=production aborts before invoking cf.sh" {
  CLOUDFLARE_ENV=production run bash "${SEED}" --env staging --fixture-file "${FIXTURE}"
  [ "${status}" -eq 1 ]
  [[ "${output}" == *"production bulk INSERT is permanently banned"* ]]
}

# TC-SEED-03
@test "seed --dry-run prints deterministic plan and exits 0" {
  run bash "${SEED}" --env staging --fixture-file "${FIXTURE}" --dry-run
  [ "${status}" -eq 0 ]
  [[ "${output}" == *"PLAN:"* ]]
  [[ "${output}" == *"DRY-RUN: no D1 write performed."* ]]
  [[ "${output}" == *"ubm-hyogo-db-staging"* ]]
  [[ "${output}" == *"--remote"* ]]
}

# TC-SEED-04
@test "seed plan uses dedupe_key LIKE 'ubm-test-fixture-50k-%' selector" {
  run bash "${SEED}" --env staging --fixture-file "${FIXTURE}" --dry-run
  [ "${status}" -eq 0 ]
  [[ "${output}" == *"dedupe_key LIKE 'ubm-test-fixture-50k-%'"* ]]
}

@test "seed missing --env aborts" {
  run bash "${SEED}" --fixture-file "${FIXTURE}" --dry-run
  [ "${status}" -eq 1 ]
}

@test "seed rejects fixture without issue-504 dedupe_key prefix" {
  echo "INSERT INTO schema_diff_queue (diff_id) VALUES ('x');" > "${FIXTURE}"
  run bash "${SEED}" --env staging --fixture-file "${FIXTURE}" --dry-run
  [ "${status}" -eq 2 ]
  [[ "${output}" == *"dedupe_key prefix"* ]]
}

# TC-CLEAN-01
@test "cleanup without --confirm is dry-run only" {
  run bash "${CLEANUP}" --env staging
  [ "${status}" -eq 0 ]
  [[ "${output}" == *"DRY-RUN: pass --confirm to actually delete."* ]]
}

# TC-CLEAN-02
@test "cleanup uses the same selector as seed verification" {
  run bash "${CLEANUP}" --env staging
  [ "${status}" -eq 0 ]
  [[ "${output}" == *"dedupe_key LIKE 'ubm-test-fixture-50k-%'"* ]]
}

@test "cleanup --env production aborts" {
  run bash "${CLEANUP}" --env production --confirm
  [ "${status}" -eq 1 ]
  [[ "${output}" == *"production cleanup is permanently banned"* ]]
}
