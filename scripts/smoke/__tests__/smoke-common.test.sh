#!/usr/bin/env bash
# Local tests for scripts/smoke/lib/smoke-common.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB="$SCRIPT_DIR/../lib/smoke-common.sh"
SMOKE_REDACT="$SCRIPT_DIR/../redact.sh"
# shellcheck source=scripts/smoke/lib/smoke-common.sh
source "$LIB"

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

TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT

smoke_summary_init
smoke_summary_pass 'seed "quoted"'
smoke_summary_fail_entry "assign" "500" 'HTTP 200 and .ok == "yes"' "non-200"
smoke_write_summary 1 "$TEST_DIR/checks-summary.json" checks
assert_eq "FAIL" "$(jq -r '.status' "$TEST_DIR/checks-summary.json")" "summary-status-fail"
assert_eq "2" "$(jq -r '.checks | length' "$TEST_DIR/checks-summary.json")" "checks-length"
assert_eq 'seed "quoted"' "$(jq -r '.checks[0].label' "$TEST_DIR/checks-summary.json")" "pass-label-escaped"
assert_eq 'HTTP 200 and .ok == "yes"' "$(jq -r '.checks[1].contract' "$TEST_DIR/checks-summary.json")" "fail-contract-escaped"
assert_eq "non-200" "$(jq -r '.checks[1].reason' "$TEST_DIR/checks-summary.json")" "fail-reason"

smoke_summary_init
smoke_summary_pass "admin-list"
smoke_write_summary 1 "$TEST_DIR/routes-summary.json" routes
assert_eq "PASS" "$(jq -r '.status' "$TEST_DIR/routes-summary.json")" "summary-status-pass"
assert_eq "1" "$(jq -r '.routes | length' "$TEST_DIR/routes-summary.json")" "routes-length"
if [[ -f "$TEST_DIR/no-summary.json" ]]; then
  echo "FAIL [ci-summary-noop] unexpected summary file exists"
  fail=$((fail + 1))
else
  smoke_write_summary 0 "$TEST_DIR/no-summary.json" routes
  if [[ -f "$TEST_DIR/no-summary.json" ]]; then
    echo "FAIL [ci-summary-noop] summary file created with ci flag 0"
    fail=$((fail + 1))
  else
    echo "PASS [ci-summary-noop]"
  fi
fi

smoke_write_summary 1 "" routes
echo "PASS [empty-summary-path-noop]"

printf 'authorization: Bearer secret-token-123456\n' | smoke_redact_filter "$TEST_DIR/redacted.log"
if grep -Fq 'secret-token-123456' "$TEST_DIR/redacted.log"; then
  echo "FAIL [redact-filter] raw token leaked"
  fail=$((fail + 1))
elif grep -Fq '[REDACTED]' "$TEST_DIR/redacted.log"; then
  echo "PASS [redact-filter]"
else
  echo "FAIL [redact-filter] redaction marker missing"
  fail=$((fail + 1))
fi

smoke_redact_line "$TEST_DIR/redacted-line.log" 'Cookie: __Secure-authjs.session-token=secret-cookie'
if grep -Fq 'secret-cookie' "$TEST_DIR/redacted-line.log"; then
  echo "FAIL [redact-line] raw cookie leaked"
  fail=$((fail + 1))
else
  echo "PASS [redact-line]"
fi

if smoke_assert_host_allow "https://staging.example.test" "staging|localhost"; then
  echo "PASS [host-allow-pass]"
else
  echo "FAIL [host-allow-pass]"
  fail=$((fail + 1))
fi
if smoke_assert_host_allow "https://production.example.test" "staging|localhost"; then
  echo "FAIL [host-allow-deny]"
  fail=$((fail + 1))
else
  echo "PASS [host-allow-deny]"
fi

assert_eq "PRODUCTION" "$(smoke_env_prefix production)" "env-prefix"

cat > "$TEST_DIR/cf.sh" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$*"
SH
chmod +x "$TEST_DIR/cf.sh"
assert_eq "d1 execute db-name --env staging --remote --json --command SELECT 1" \
  "$(smoke_run_d1 "$TEST_DIR/cf.sh" db-name staging --json --command "SELECT 1")" \
  "run-d1-wrapper"

if [[ "$fail" -ne 0 ]]; then
  echo "FAIL: $fail smoke-common case(s)"
  exit 1
fi

echo "OK: smoke-common tests pass"
