#!/usr/bin/env bats
# Issue #504: contract tests for run-stress-trial.sh

setup() {
  SCRIPT_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")/.." && pwd)"
  RUNNER="${SCRIPT_DIR}/run-stress-trial.sh"
  EVIDENCE="$(mktemp)"
}

teardown() {
  rm -f "${EVIDENCE}"
}

@test "run-stress-trial dry-run writes schema-compatible plan" {
  run bash "${RUNNER}" \
    --trials 10 \
    --trigger-path /admin/schema/backfill/trigger \
    --poll-interval-seconds 10 \
    --timeout-seconds 1800 \
    --evidence-out "${EVIDENCE}" \
    --dry-run
  [ "${status}" -eq 0 ]
  [ -s "${EVIDENCE}" ]
  node -e 'const fs=require("node:fs"); const v=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if (v.runtime.environment !== "staging" || v._dryRun !== true) process.exit(1);' "${EVIDENCE}"
}

@test "run-stress-trial rejects non-canonical trigger path" {
  run bash "${RUNNER}" --trigger-path /admin/schema/backfill/not-trigger --dry-run
  [ "${status}" -eq 1 ]
  [[ "${output}" == *"trigger-path must be /admin/schema/backfill/trigger"* ]]
}

@test "run-stress-trial live mode requires staging API URL" {
  run bash "${RUNNER}" \
    --trials 10 \
    --trigger-path /admin/schema/backfill/trigger \
    --poll-interval-seconds 10 \
    --timeout-seconds 1800
  [ "${status}" -eq 2 ]
  [[ "${output}" == *"--api-base-url or ADMIN_API_BASE_URL is required"* ]]
}
