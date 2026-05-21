#!/usr/bin/env bash
# T-4 runtime-attendance-provider.sh --out-dir / --ci-summary 単体テスト
# (issue-571 phase-04 §T-4)
#
# unreachable endpoint (127.0.0.1:1) で意図的に fail させ、
# --out-dir 配下に runtime-smoke.log と summary.json が生成される事を assert する。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../runtime-attendance-provider.sh"

fail=0

# --- T-4-1: --out-dir + --ci-summary 指定時に summary.json が出力される ---
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT

set +e
STAGING_API_BASE=http://127.0.0.1:1 \
STAGING_ADMIN_BEARER=stub-admin \
STAGING_MEMBER_ID=stub-member \
STAGING_ME_BEARER=stub-me \
  bash "$RUNNER" staging --out-dir "$TEST_DIR" --ci-summary >/dev/null 2>&1
exit_code=$?
set -e

if [[ "$exit_code" -ne 1 ]]; then
  echo "FAIL [T-4-1] expected exit 1 (unreachable host), got $exit_code"
  fail=$((fail + 1))
fi

if [[ ! -f "$TEST_DIR/runtime-smoke.log" ]]; then
  echo "FAIL [T-4-1] runtime-smoke.log not created in $TEST_DIR"
  fail=$((fail + 1))
else
  echo "PASS [T-4-1] runtime-smoke.log created"
fi

if [[ ! -f "$TEST_DIR/summary.json" ]]; then
  echo "FAIL [T-4-1] summary.json not created in $TEST_DIR"
  fail=$((fail + 1))
else
  if ! jq -e '.status == "FAIL"' "$TEST_DIR/summary.json" >/dev/null 2>&1; then
    echo "FAIL [T-4-1] summary.json status != FAIL"
    fail=$((fail + 1))
  else
    echo "PASS [T-4-1] summary.json valid with FAIL status"
  fi
fi

# --- T-4-2: --ci-summary なしでは summary.json は出力されない（後方互換） ---
TEST_DIR2="$(mktemp -d)"
set +e
STAGING_API_BASE=http://127.0.0.1:1 \
STAGING_ADMIN_BEARER=stub-admin \
STAGING_MEMBER_ID=stub-member \
STAGING_ME_BEARER=stub-me \
  bash "$RUNNER" staging --out-dir "$TEST_DIR2" >/dev/null 2>&1 || true
set -e
if [[ -f "$TEST_DIR2/summary.json" ]]; then
  echo "FAIL [T-4-2] summary.json should not exist without --ci-summary"
  fail=$((fail + 1))
else
  echo "PASS [T-4-2] summary.json not created without --ci-summary"
fi
rm -rf "$TEST_DIR2"

# --- T-4-3: 引数異常系 (env != staging) ---
set +e
STAGING_API_BASE=stub STAGING_ADMIN_BEARER=stub STAGING_MEMBER_ID=stub STAGING_ME_BEARER=stub \
  bash "$RUNNER" production >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 2 ]]; then
  echo "FAIL [T-4-3] non-staging should exit 2, got $ec"
  fail=$((fail + 1))
else
  echo "PASS [T-4-3] non-staging exits 2"
fi

# --- T-4-4: 不明な引数 ---
set +e
STAGING_API_BASE=stub STAGING_ADMIN_BEARER=stub STAGING_MEMBER_ID=stub STAGING_ME_BEARER=stub \
  bash "$RUNNER" staging --bogus >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 2 ]]; then
  echo "FAIL [T-4-4] unknown arg should exit 2, got $ec"
  fail=$((fail + 1))
else
  echo "PASS [T-4-4] unknown arg exits 2"
fi

# --- T-4-5: route non-200 時に response body を runtime-smoke.log へ残す ---
TEST_DIR3="$(mktemp -d)"
FAKE_BIN="$TEST_DIR3/bin"
mkdir -p "$FAKE_BIN"
cat > "$FAKE_BIN/curl" <<'SH'
#!/usr/bin/env bash
out=""
url="${@: -1}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o)
      out="$2"
      shift 2
      ;;
    -w)
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done
if [[ "$url" == "http://staging.example.test/" ]]; then
  printf '{"environment":"staging"}' > "$out"
  printf '200'
  exit 0
fi
printf '{"ok":false,"error":"staging failure","sessionToken":"secret-value-1","accessToken":"secret-value-2"}' > "$out"
printf '500'
SH
chmod +x "$FAKE_BIN/curl"

set +e
PATH="$FAKE_BIN:$PATH" \
STAGING_API_BASE=http://staging.example.test \
STAGING_API_HOST_ALLOW_REGEX=staging.example.test \
STAGING_ADMIN_BEARER=stub-admin \
STAGING_MEMBER_ID=stub-member \
STAGING_ME_BEARER=stub-me \
  bash "$RUNNER" staging --out-dir "$TEST_DIR3" --ci-summary >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 1 ]]; then
  echo "FAIL [T-4-5] route 500 should exit 1, got $ec"
  fail=$((fail + 1))
elif ! grep -Fq '===== admin-list GET =====' "$TEST_DIR3/runtime-smoke.log"; then
  echo "FAIL [T-4-5] runtime-smoke.log does not identify admin-list failure"
  fail=$((fail + 1))
elif ! grep -Fq 'body={"ok":false,"error":"staging failure","sessionToken":"[REDACTED]","accessToken":"[REDACTED]"}' "$TEST_DIR3/runtime-smoke.log"; then
  echo "FAIL [T-4-5] runtime-smoke.log does not include non-200 response body"
  fail=$((fail + 1))
elif grep -Eq 'secret-value-[12]' "$TEST_DIR3/runtime-smoke.log"; then
  echo "FAIL [T-4-5] runtime-smoke.log leaked token-like response body values"
  fail=$((fail + 1))
else
  echo "PASS [T-4-5] non-200 response body is persisted with redaction"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "FAIL: $fail cases"
  exit 1
fi
echo "OK: runtime-attendance-provider tests pass"
