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

fake_jwt_with_exp() {
  node -e 'const exp=Number(process.argv[1]); const b=(v)=>Buffer.from(JSON.stringify(v)).toString("base64url"); console.log(`${b({alg:"HS256",typ:"JWT"})}.${b({exp})}.sig`)' "$1"
}

fake_jwt_with_sub() {
  node -e 'const sub=process.argv[1]; const exp=Number(process.argv[2]); const b=(v)=>Buffer.from(JSON.stringify(v)).toString("base64url"); console.log(`${b({alg:"HS256",typ:"JWT"})}.${b({sub,exp})}.sig`)' "$1" "$2"
}

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

# --- T-4-3: 引数異常系 (env が staging/production 以外) ---
set +e
STAGING_API_BASE=stub STAGING_ADMIN_BEARER=stub STAGING_MEMBER_ID=stub STAGING_ME_BEARER=stub \
  bash "$RUNNER" development >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 2 ]]; then
  echo "FAIL [T-4-3] unknown env should exit 2, got $ec"
  fail=$((fail + 1))
else
  echo "PASS [T-4-3] unknown env exits 2"
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

# --- T-4-6: auth misconfigured body は AUTH_SECRET binding 原因として分類する ---
TEST_DIR4="$(mktemp -d)"
FAKE_BIN2="$TEST_DIR4/bin"
mkdir -p "$FAKE_BIN2"
cat > "$FAKE_BIN2/curl" <<'SH'
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
printf '{ "error": "auth misconfigured" }' > "$out"
printf '500'
SH
chmod +x "$FAKE_BIN2/curl"

set +e
PATH="$FAKE_BIN2:$PATH" \
STAGING_API_BASE=http://staging.example.test \
STAGING_API_HOST_ALLOW_REGEX=staging.example.test \
STAGING_ADMIN_BEARER=stub-admin \
STAGING_MEMBER_ID=stub-member \
STAGING_ME_BEARER=stub-me \
  bash "$RUNNER" staging --out-dir "$TEST_DIR4" --ci-summary >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 1 ]]; then
  echo "FAIL [T-4-6] auth misconfigured should exit 1, got $ec"
  fail=$((fail + 1))
elif ! grep -Fq 'reason=auth-secret-binding-missing' "$TEST_DIR4/runtime-smoke.log"; then
  echo "FAIL [T-4-6] runtime-smoke.log lacks auth-secret-binding-missing reason"
  fail=$((fail + 1))
elif ! jq -e '.routes[0].reason == "auth-secret-binding-missing"' "$TEST_DIR4/summary.json" >/dev/null 2>&1; then
  echo "FAIL [T-4-6] summary.json lacks auth-secret-binding-missing reason"
  fail=$((fail + 1))
else
  echo "PASS [T-4-6] auth misconfigured is classified as AUTH_SECRET binding missing"
fi

# --- T-4-7: 401 unauthorized かつ exp 未来は AUTH_SECRET drift として分類する ---
TEST_DIR5="$(mktemp -d)"
FAKE_BIN3="$TEST_DIR5/bin"
mkdir -p "$FAKE_BIN3"
cat > "$FAKE_BIN3/curl" <<'SH'
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
printf '{ "error": "unauthorized" }' > "$out"
printf '401'
SH
chmod +x "$FAKE_BIN3/curl"

set +e
PATH="$FAKE_BIN3:$PATH" \
STAGING_API_BASE=http://staging.example.test \
STAGING_API_HOST_ALLOW_REGEX=staging.example.test \
STAGING_ADMIN_BEARER="$(fake_jwt_with_exp $(( $(date +%s) + 3600 )))" \
STAGING_MEMBER_ID=stub-member \
STAGING_ME_BEARER=stub-me \
  bash "$RUNNER" staging --out-dir "$TEST_DIR5" --ci-summary >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 1 ]]; then
  echo "FAIL [T-4-7] 401 unauthorized should exit 1, got $ec"
  fail=$((fail + 1))
elif ! grep -Fq 'reason=auth-secret-drift' "$TEST_DIR5/runtime-smoke.log"; then
  echo "FAIL [T-4-7] runtime-smoke.log lacks auth-secret-drift reason"
  fail=$((fail + 1))
elif ! jq -e '.routes[0].reason == "auth-secret-drift"' "$TEST_DIR5/summary.json" >/dev/null 2>&1; then
  echo "FAIL [T-4-7] summary.json lacks auth-secret-drift reason"
  fail=$((fail + 1))
else
  echo "PASS [T-4-7] 401 unauthorized with future exp is classified as AUTH_SECRET drift"
fi

# --- T-4-8: 401 unauthorized かつ exp 過去は bearer expired として分類する ---
TEST_DIR6="$(mktemp -d)"
set +e
PATH="$FAKE_BIN3:$PATH" \
STAGING_API_BASE=http://staging.example.test \
STAGING_API_HOST_ALLOW_REGEX=staging.example.test \
STAGING_ADMIN_BEARER="$(fake_jwt_with_exp $(( $(date +%s) - 60 )))" \
STAGING_MEMBER_ID=stub-member \
STAGING_ME_BEARER=stub-me \
  bash "$RUNNER" staging --out-dir "$TEST_DIR6" --ci-summary >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 1 ]]; then
  echo "FAIL [T-4-8] 401 unauthorized should exit 1, got $ec"
  fail=$((fail + 1))
elif ! grep -Fq 'reason=auth-token-expired' "$TEST_DIR6/runtime-smoke.log"; then
  echo "FAIL [T-4-8] runtime-smoke.log lacks auth-token-expired reason"
  fail=$((fail + 1))
elif ! jq -e '.routes[0].reason == "auth-token-expired"' "$TEST_DIR6/summary.json" >/dev/null 2>&1; then
  echo "FAIL [T-4-8] summary.json lacks auth-token-expired reason"
  fail=$((fail + 1))
else
  echo "PASS [T-4-8] 401 unauthorized with past exp is classified as bearer expired"
fi

# --- T-4-9: 403 forbidden は admin 権限不足として分類する ---
TEST_DIR7="$(mktemp -d)"
FAKE_BIN4="$TEST_DIR7/bin"
mkdir -p "$FAKE_BIN4"
cat > "$FAKE_BIN4/curl" <<'SH'
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
printf '{ "error": "forbidden" }' > "$out"
printf '403'
SH
chmod +x "$FAKE_BIN4/curl"

set +e
PATH="$FAKE_BIN4:$PATH" \
STAGING_API_BASE=http://staging.example.test \
STAGING_API_HOST_ALLOW_REGEX=staging.example.test \
STAGING_ADMIN_BEARER=stub-admin \
STAGING_MEMBER_ID=stub-member \
STAGING_ME_BEARER=stub-me \
  bash "$RUNNER" staging --out-dir "$TEST_DIR7" --ci-summary >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 1 ]]; then
  echo "FAIL [T-4-9] 403 forbidden should exit 1, got $ec"
  fail=$((fail + 1))
elif ! grep -Fq 'reason=auth-not-admin' "$TEST_DIR7/runtime-smoke.log"; then
  echo "FAIL [T-4-9] runtime-smoke.log lacks auth-not-admin reason"
  fail=$((fail + 1))
elif ! jq -e '.routes[0].reason == "auth-not-admin"' "$TEST_DIR7/summary.json" >/dev/null 2>&1; then
  echo "FAIL [T-4-9] summary.json lacks auth-not-admin reason"
  fail=$((fail + 1))
else
  echo "PASS [T-4-9] 403 forbidden is classified as not-admin"
fi

# --- T-4-10: production で bearer subject が allowlist 外なら exit 2 で拒否 ---
TEST_DIR8="$(mktemp -d)"
blocked_bearer="$(fake_jwt_with_sub "blocked-member" "$(( $(date +%s) + 3600 ))")"
set +e
PRODUCTION_API_BASE=http://127.0.0.1:1 \
PRODUCTION_ADMIN_BEARER="$blocked_bearer" \
PRODUCTION_MEMBER_ID=stub-member \
PRODUCTION_ME_BEARER="$blocked_bearer" \
PRODUCTION_SMOKE_ALLOWED_SUBJECTS="allowed-member-1,allowed-member-2" \
  bash "$RUNNER" production --out-dir "$TEST_DIR8" >/dev/null 2>&1
ec=$?
set -e
rm -rf "$TEST_DIR8"
if [[ "$ec" -ne 2 ]]; then
  echo "FAIL [T-4-10] production with non-allowlisted subject should exit 2, got $ec"
  fail=$((fail + 1))
else
  echo "PASS [T-4-10] production refuses non-allowlisted bearer subject (exit 2)"
fi

# --- T-4-11: production で allowlist 内の subject なら gate を通過し smoke 実行へ進む ---
# allowlist 通過後に marker (環境 production) を返す fake curl を当て、route stub 500 で exit 1。
# exit 2 ではなく exit 1 になることで「allowlist は通過し実行に進んだ」ことを確認する。
TEST_DIR9="$(mktemp -d)"
FAKE_BIN5="$TEST_DIR9/bin"
mkdir -p "$FAKE_BIN5"
cat > "$FAKE_BIN5/curl" <<'SH'
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
if [[ "$url" == "http://prod.example.test/" ]]; then
  printf '{"environment":"production"}' > "$out"
  printf '200'
  exit 0
fi
printf '{"error":"unauthorized"}' > "$out"
printf '401'
SH
chmod +x "$FAKE_BIN5/curl"

allowed_bearer="$(fake_jwt_with_sub "allowed-member-1" "$(( $(date +%s) + 3600 ))")"
set +e
PATH="$FAKE_BIN5:$PATH" \
PRODUCTION_API_BASE=http://prod.example.test \
PRODUCTION_API_HOST_ALLOW_REGEX=prod.example.test \
PRODUCTION_ADMIN_BEARER="$allowed_bearer" \
PRODUCTION_MEMBER_ID=stub-member \
PRODUCTION_ME_BEARER="$allowed_bearer" \
PRODUCTION_SMOKE_ALLOWED_SUBJECTS="allowed-member-1 allowed-member-2" \
  bash "$RUNNER" production --out-dir "$TEST_DIR9" --ci-summary >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 1 ]]; then
  echo "FAIL [T-4-11] allowlisted production run should reach smoke and exit 1 on stub failure, got $ec"
  fail=$((fail + 1))
elif ! grep -Fq '===== admin-list GET =====' "$TEST_DIR9/runtime-smoke.log"; then
  echo "FAIL [T-4-11] allowlisted production run did not proceed to route checks"
  fail=$((fail + 1))
else
  echo "PASS [T-4-11] allowlisted production bearer passes gate and runs smoke"
fi
rm -rf "$TEST_DIR9"

if [[ "$fail" -ne 0 ]]; then
  echo "FAIL: $fail cases"
  exit 1
fi
echo "OK: runtime-attendance-provider tests pass"
