#!/usr/bin/env bash
# Local tests for scripts/smoke/capture-bulk-tag-result.sh. No staging or D1 connection.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../capture-bulk-tag-result.sh"
fail=0

assert_eq() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [[ "$expected" != "$actual" ]]; then
    echo "FAIL [$label] expected $expected, got $actual"
    fail=$((fail + 1))
  else
    echo "PASS [$label]"
  fi
}

run_expect_exit() {
  local label="$1"
  local expected="$2"
  shift 2
  set +e
  "$@" >/dev/null 2>&1
  local code=$?
  set -e
  assert_eq "$expected" "$code" "$label"
}

run_expect_exit "env-required" 2 bash "$RUNNER"
run_expect_exit "production-env-refused" 2 env PLAYWRIGHT_STAGING_BASE_URL=http://staging.example.test bash "$RUNNER" production
run_expect_exit "unknown-env-refused" 2 env PLAYWRIGHT_STAGING_BASE_URL=http://staging.example.test bash "$RUNNER" dev
run_expect_exit "production-url-refused" 2 env PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-production.example.test bash "$RUNNER" staging
run_expect_exit "d1-database-refused" 2 env PLAYWRIGHT_STAGING_BASE_URL=http://staging.example.test CF_D1_DATABASE=ubm-hyogo-db-production bash "$RUNNER" staging

set +u
source "$RUNNER"
set -u

parsed_count="$(printf '{"result":[{"results":[{"c":2}]}]}' | extract_count)"
assert_eq "2" "$parsed_count" "extract-count"

TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT
FAKE_BIN="$TEST_DIR/bin"
mkdir -p "$FAKE_BIN"

cat > "$FAKE_BIN/pnpm" <<'SH'
#!/usr/bin/env bash
if [[ "${PLAYWRIGHT_EVIDENCE_DIR:-}" != "${EXPECTED_PLAYWRIGHT_EVIDENCE_DIR:-}" ]]; then
  printf 'unexpected PLAYWRIGHT_EVIDENCE_DIR=%s expected=%s\n' \
    "${PLAYWRIGHT_EVIDENCE_DIR:-}" "${EXPECTED_PLAYWRIGHT_EVIDENCE_DIR:-}" >&2
  exit 7
fi
if [[ "${FAKE_PLAYWRIGHT_FAIL:-0}" == "1" ]]; then
  printf 'fake playwright capture failed\n' >&2
  exit 9
fi
printf 'fake playwright capture ok\n'
exit 0
SH
chmod +x "$FAKE_BIN/pnpm"

cat > "$TEST_DIR/cf.sh" <<'SH'
#!/usr/bin/env bash
if [[ "$*" == *"--file"* ]]; then
  printf '{"success":true}\n'
else
  printf '{"result":[{"results":[{"c":0}]}]}\n'
fi
SH
chmod +x "$TEST_DIR/cf.sh"

set +e
PATH="$FAKE_BIN:$PATH" \
PLAYWRIGHT_STAGING_BASE_URL=http://staging.example.test \
CF_SH_PATH="$TEST_DIR/cf.sh" \
EXPECTED_PLAYWRIGHT_EVIDENCE_DIR="$TEST_DIR/screenshots" \
  bash "$RUNNER" staging --out-dir "$TEST_DIR/evidence" --ci-summary --skip-seed --no-update-snapshots >/dev/null 2>&1
runner_code=$?
set -e
assert_eq "0" "$runner_code" "runner-stub-pass"
if [[ -f "$TEST_DIR/evidence/summary.json" ]] && jq -e '.status == "PASS"' "$TEST_DIR/evidence/summary.json" >/dev/null; then
  echo "PASS [summary-pass]"
else
  echo "FAIL [summary-pass]"
  fail=$((fail + 1))
fi
if [[ -f "$TEST_DIR/evidence/capture-bulk-tag-result.log" ]]; then
  echo "PASS [log-name]"
else
  echo "FAIL [log-name]"
  fail=$((fail + 1))
fi

set +e
PATH="$FAKE_BIN:$PATH" \
PLAYWRIGHT_STAGING_BASE_URL=http://staging.example.test \
CF_SH_PATH="$TEST_DIR/cf.sh" \
EXPECTED_PLAYWRIGHT_EVIDENCE_DIR="$TEST_DIR/fail-screenshots" \
FAKE_PLAYWRIGHT_FAIL=1 \
  bash "$RUNNER" staging --out-dir "$TEST_DIR/fail-evidence" --ci-summary --skip-seed --no-update-snapshots >/dev/null 2>&1
runner_fail_code=$?
set -e
assert_eq "1" "$runner_fail_code" "runner-stub-capture-fail"
if [[ -f "$TEST_DIR/fail-evidence/summary.json" ]] && jq -e '.status == "FAIL" and any(.checks[]; .label == "capture" and .status == "FAIL")' "$TEST_DIR/fail-evidence/summary.json" >/dev/null; then
  echo "PASS [summary-fail]"
else
  echo "FAIL [summary-fail]"
  fail=$((fail + 1))
fi

if [[ "$fail" -ne 0 ]]; then
  echo "FAIL: $fail cases"
  exit 1
fi
echo "OK: capture-bulk-tag-result tests pass"
