#!/usr/bin/env bash
# Local tests for scripts/smoke/runtime-tag-bulk.sh. No staging or D1 connection.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../runtime-tag-bulk.sh"
REDACT="$SCRIPT_DIR/../redact.sh"
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
run_expect_exit "production-env-refused" 2 env STAGING_API_BASE=http://staging.example.test STAGING_ADMIN_BEARER=stub bash "$RUNNER" production
run_expect_exit "unknown-env-refused" 2 env STAGING_API_BASE=http://staging.example.test STAGING_ADMIN_BEARER=stub bash "$RUNNER" dev
run_expect_exit "missing-api-base" 2 env STAGING_ADMIN_BEARER=stub bash "$RUNNER" staging
run_expect_exit "production-url-refused" 2 env STAGING_API_BASE=https://ubm-hyogo-api-production.example.test STAGING_ADMIN_BEARER=stub bash "$RUNNER" staging
run_expect_exit "d1-database-refused" 2 env STAGING_API_BASE=http://staging.example.test STAGING_ADMIN_BEARER=stub CF_D1_DATABASE=ubm-hyogo-db-production bash "$RUNNER" staging

redacted="$(printf 'authorization: Bearer abc123tokenvalue0000\nCookie: __Secure-authjs.session-token=secretval\n' | bash "$REDACT")"
if [[ "$redacted" == *"abc123tokenvalue0000"* || "$redacted" == *"secretval"* ]]; then
  echo "FAIL [redaction] raw secret leaked"
  fail=$((fail + 1))
elif [[ "$redacted" != *"[REDACTED]"* ]]; then
  echo "FAIL [redaction] redaction marker missing"
  fail=$((fail + 1))
else
  echo "PASS [redaction]"
fi

set +u
source "$RUNNER"
set -u

assigned='{"batchId":"b1","results":[{"memberId":"m1","tagId":"t1","status":"assigned"},{"memberId":"m1","tagId":"t2","status":"assigned"},{"memberId":"m2","tagId":"t1","status":"assigned"},{"memberId":"m2","tagId":"t2","status":"assigned"}]}'
noop='{"batchId":"b1","results":[{"memberId":"m1","tagId":"t1","status":"noop"},{"memberId":"m1","tagId":"t2","status":"noop"},{"memberId":"m2","tagId":"t1","status":"noop"},{"memberId":"m2","tagId":"t2","status":"noop"}]}'
unassigned='{"batchId":"b1","results":[{"memberId":"m1","tagId":"t1","status":"unassigned"},{"memberId":"m1","tagId":"t2","status":"unassigned"},{"memberId":"m2","tagId":"t1","status":"unassigned"},{"memberId":"m2","tagId":"t2","status":"unassigned"}]}'
mixed='{"batchId":"b1","results":[{"status":"assigned"},{"status":"tag_not_found"},{"status":"assigned"},{"status":"assigned"}]}'
missing_batch='{"results":[{"status":"assigned"},{"status":"assigned"},{"status":"assigned"},{"status":"assigned"}]}'
empty_results='{"batchId":"b1","results":[]}'

if assert_all_status "$assigned" assigned 4; then echo "PASS [assert-assigned]"; else echo "FAIL [assert-assigned]"; fail=$((fail + 1)); fi
if assert_all_status "$noop" noop 4; then echo "PASS [assert-noop]"; else echo "FAIL [assert-noop]"; fail=$((fail + 1)); fi
if assert_all_status "$unassigned" unassigned 4; then echo "PASS [assert-unassigned]"; else echo "FAIL [assert-unassigned]"; fail=$((fail + 1)); fi
if assert_all_status "$mixed" assigned 4; then echo "FAIL [assert-mixed-fails]"; fail=$((fail + 1)); else echo "PASS [assert-mixed-fails]"; fi
if assert_all_status "$missing_batch" assigned 4; then echo "FAIL [assert-batch-required]"; fail=$((fail + 1)); else echo "PASS [assert-batch-required]"; fi
if assert_all_status "$empty_results" assigned 4; then echo "FAIL [assert-empty-fails]"; fail=$((fail + 1)); else echo "PASS [assert-empty-fails]"; fi

parsed_count="$(printf '{"result":[{"results":[{"c":2}]}]}' | extract_count)"
assert_eq "2" "$parsed_count" "extract-count"

TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT
FAKE_BIN="$TEST_DIR/bin"
mkdir -p "$FAKE_BIN"
cat > "$FAKE_BIN/curl" <<'SH'
#!/usr/bin/env bash
out=""
data=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    -w) shift 2 ;;
    --data) data="$2"; shift 2 ;;
    *) shift ;;
  esac
done
op="$(printf '%s' "$data" | jq -r '.op')"
if [[ "$op" == "assign" && ! -f "${TMPDIR:-/tmp}/issue1081_retry_seen" ]]; then
  touch "${TMPDIR:-/tmp}/issue1081_retry_seen"
  printf '{"batchId":"b1","results":[{"memberId":"m1","tagId":"t1","status":"assigned"},{"memberId":"m1","tagId":"t2","status":"assigned"},{"memberId":"m2","tagId":"t1","status":"assigned"},{"memberId":"m2","tagId":"t2","status":"assigned"}]}' > "$out"
elif [[ "$op" == "assign" ]]; then
  printf '{"batchId":"b2","results":[{"memberId":"m1","tagId":"t1","status":"noop"},{"memberId":"m1","tagId":"t2","status":"noop"},{"memberId":"m2","tagId":"t1","status":"noop"},{"memberId":"m2","tagId":"t2","status":"noop"}]}' > "$out"
else
  printf '{"batchId":"b3","results":[{"memberId":"m1","tagId":"t1","status":"unassigned"},{"memberId":"m1","tagId":"t2","status":"unassigned"},{"memberId":"m2","tagId":"t1","status":"unassigned"},{"memberId":"m2","tagId":"t2","status":"unassigned"}]}' > "$out"
fi
printf '200'
SH
chmod +x "$FAKE_BIN/curl"

cat > "$TEST_DIR/cf.sh" <<'SH'
#!/usr/bin/env bash
args="$*"
if [[ "$args" == *"--file"* ]]; then
  printf '{"success":true}\n'
elif [[ "$args" == *"admin.member.tag_assigned"* ]]; then
  printf '{"result":[{"results":[{"c":4}]}]}\n'
elif [[ "$args" == *"admin.member.tag_unassigned"* ]]; then
  state="${TMPDIR:-/tmp}/issue1081_unassigned_seen"
  if [[ -f "$state" ]]; then
    printf '{"result":[{"results":[{"c":4}]}]}\n'
  else
    touch "$state"
    printf '{"result":[{"results":[{"c":0}]}]}\n'
  fi
else
  printf '{"result":[{"results":[{"c":0}]}]}\n'
fi
SH
chmod +x "$TEST_DIR/cf.sh"

set +e
PATH="$FAKE_BIN:$PATH" \
TMPDIR="$TEST_DIR" \
STAGING_API_BASE=http://staging.example.test \
STAGING_ADMIN_BEARER=stub-admin \
CF_SH_PATH="$TEST_DIR/cf.sh" \
  bash "$RUNNER" staging --out-dir "$TEST_DIR/evidence" --ci-summary --skip-seed >/dev/null 2>&1
runner_code=$?
set -e
assert_eq "0" "$runner_code" "runner-stub-pass"
if [[ -f "$TEST_DIR/evidence/summary.json" ]] && jq -e '.status == "PASS"' "$TEST_DIR/evidence/summary.json" >/dev/null; then
  echo "PASS [summary-pass]"
else
  echo "FAIL [summary-pass]"
  fail=$((fail + 1))
fi

if [[ "$fail" -ne 0 ]]; then
  echo "FAIL: $fail cases"
  exit 1
fi
echo "OK: runtime-tag-bulk tests pass"
