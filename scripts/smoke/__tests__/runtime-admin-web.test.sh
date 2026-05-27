#!/usr/bin/env bash
# runtime-admin-web.sh contract tests with curl/tail fixtures only.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../runtime-admin-web.sh"

fail=0

make_curl_stub() {
  local dir="$1"
  local mode="$2"
  cat > "$dir/curl" <<SH
#!/usr/bin/env bash
out=""
while [[ \$# -gt 0 ]]; do
  case "\$1" in
    -o)
      out="\$2"
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
case "$mode" in
  pass)
    printf '<html><main>admin ok</main></html>' > "\$out"
    printf '200'
    ;;
  redirect)
    printf '<html>login</html>' > "\$out"
    printf '302'
    ;;
  forbidden)
    printf 'Forbidden' > "\$out"
    printf '403'
    ;;
  render)
    printf 'An error occurred in the Server Components render. digest=167275886' > "\$out"
    printf '200'
    ;;
esac
SH
  chmod +x "$dir/curl"
}

run_case() {
  local name="$1"
  local env_name="$2"
  local mode="$3"
  local tail_text="$4"
  local expected_exit="$5"
  local expected_reason="$6"
  local production_web_base="${7-https://ubm-hyogo-web-production.example.test}"
  local production_allow_regex="${8-production.example.test}"
  local dir
  dir="$(mktemp -d)"
  mkdir -p "$dir/bin"
  make_curl_stub "$dir/bin" "$mode"
  printf '%s' "$tail_text" > "$dir/tail.log"
  set +e
  PATH="$dir/bin:$PATH" \
  STAGING_WEB_BASE=http://staging.example.test \
  STAGING_WEB_HOST_ALLOW_REGEX=staging.example.test \
  STAGING_ADMIN_SESSION_COOKIE='__Secure-authjs.session-token=secret-cookie-value' \
  PRODUCTION_WEB_BASE="$production_web_base" \
  PRODUCTION_WEB_HOST_ALLOW_REGEX="$production_allow_regex" \
  PRODUCTION_ADMIN_SESSION_COOKIE='__Secure-authjs.session-token=secret-cookie-value' \
  CF_TAIL_FILE="$dir/tail.log" \
    bash "$RUNNER" "$env_name" --out-dir "$dir/out" --ci-summary >/dev/null 2>&1
  local ec=$?
  set -e
  if [[ "$ec" -ne "$expected_exit" ]]; then
    echo "FAIL [$name] expected exit $expected_exit, got $ec"
    fail=$((fail + 1))
  elif [[ "$expected_exit" -eq 0 ]] && ! jq -e '.status == "PASS"' "$dir/out/summary.json" >/dev/null 2>&1; then
    echo "FAIL [$name] summary status is not PASS"
    fail=$((fail + 1))
  elif [[ "$expected_exit" -ne 0 ]] && ! jq -e --arg reason "$expected_reason" '.checks[] | select(.reason == $reason)' "$dir/out/summary.json" >/dev/null 2>&1; then
    echo "FAIL [$name] summary lacks reason $expected_reason"
    fail=$((fail + 1))
  elif grep -Fq 'secret-cookie-value' "$dir/out/runtime-smoke.log"; then
    echo "FAIL [$name] runtime log leaked cookie value"
    fail=$((fail + 1))
  else
    echo "PASS [$name]"
  fi
  rm -rf "$dir"
}

run_missing_production_base_case() {
  local dir
  dir="$(mktemp -d)"
  mkdir -p "$dir/bin"
  make_curl_stub "$dir/bin" pass
  printf '{"outcome":"ok"}' > "$dir/tail.log"
  set +e
  PATH="$dir/bin:$PATH" \
  STAGING_WEB_BASE=http://staging.example.test \
  STAGING_ADMIN_SESSION_COOKIE='__Secure-authjs.session-token=staging-cookie-value' \
  PRODUCTION_ADMIN_SESSION_COOKIE='__Secure-authjs.session-token=production-cookie-value' \
  CF_TAIL_FILE="$dir/tail.log" \
    bash "$RUNNER" production --out-dir "$dir/out" --ci-summary >"$dir/stdout.log" 2>"$dir/stderr.log"
  local ec=$?
  set -e
  if [[ "$ec" -ne 2 ]]; then
    echo "FAIL [production-missing-web-base] expected exit 2, got $ec"
    fail=$((fail + 1))
  elif ! grep -Fq 'PRODUCTION_WEB_BASE is required' "$dir/stderr.log"; then
    echo "FAIL [production-missing-web-base] missing required env message"
    fail=$((fail + 1))
  elif grep -Fq 'STAGING_WEB_BASE is required' "$dir/stderr.log"; then
    echo "FAIL [production-missing-web-base] read staging env path"
    fail=$((fail + 1))
  else
    echo "PASS [production-missing-web-base]"
  fi
  rm -rf "$dir"
}

set +e
bash "$RUNNER" >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 2 ]]; then
  echo "FAIL [arg-required] expected exit 2, got $ec"
  fail=$((fail + 1))
else
  echo "PASS [arg-required]"
fi

set +e
STAGING_WEB_BASE=http://staging.example.test STAGING_ADMIN_SESSION_COOKIE=x bash "$RUNNER" preview >/dev/null 2>&1
ec=$?
set -e
if [[ "$ec" -ne 2 ]]; then
  echo "FAIL [unsupported-env] expected exit 2, got $ec"
  fail=$((fail + 1))
else
  echo "PASS [unsupported-env]"
fi

run_case "admin-pass" "staging" "pass" '{"outcome":"ok"}' 0 ""
run_case "production-admin-pass" "production" "pass" '{"outcome":"ok"}' 0 ""
run_case "production-allowlist-default" "production" "pass" '{"outcome":"ok"}' 0 "" "https://ubm-hyogo-web-production.daishimanju.workers.dev" ""
run_case "production-allowlist-deny" "production" "pass" '{"outcome":"ok"}' 2 "target-not-production" "https://evil.example.com" ""
run_missing_production_base_case
run_case "redirect" "staging" "redirect" '{"outcome":"ok"}' 1 "auth-token-invalid-or-expired"
run_case "production-redirect" "production" "redirect" '{"outcome":"ok"}' 1 "auth-token-invalid-or-expired"
run_case "forbidden" "staging" "forbidden" '{"outcome":"ok"}' 1 "auth-not-admin"
run_case "body-render-error" "staging" "render" '{"outcome":"ok"}' 1 "server-components-render-error"
run_case "production-body-render-error" "production" "render" '{"outcome":"ok"}' 1 "server-components-render-error"
run_case "tail-render-error" "staging" "pass" '{"event":"error.boundary.caught","digest":"167275886"}' 1 "server-components-render-error"
run_case "production-tail-render-error" "production" "pass" '{"event":"error.boundary.caught","digest":"167275886"}' 1 "server-components-render-error"

if grep -Fq 'ubm-hyogo-web-${ENVIRONMENT}' "$RUNNER"; then
  echo "PASS [worker-name-default-template]"
else
  echo "FAIL [worker-name-default-template] missing env-specific worker default"
  fail=$((fail + 1))
fi

if [[ "$fail" -ne 0 ]]; then
  echo "$fail runtime-admin-web test(s) failed"
  exit 1
fi

echo "runtime-admin-web tests PASS"
