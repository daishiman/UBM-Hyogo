#!/usr/bin/env bash
# Authenticated /admin runtime smoke runner for the web Worker.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SMOKE_REDACT="$SCRIPT_DIR/redact.sh"
# shellcheck source=scripts/smoke/lib/smoke-common.sh
source "$SCRIPT_DIR/lib/smoke-common.sh"
ENVIRONMENT="${1:-}"
shift || true
if [[ -z "$ENVIRONMENT" ]]; then
  echo "env required" >&2
  exit 2
fi
case "$ENVIRONMENT" in
  staging|production) ;;
  *)
  echo "Only staging or production runtime smoke is allowed" >&2
  exit 2
  ;;
esac

OUT_DIR_DEFAULT="docs/30-workflows/issue-864-admin-staging-runtime-smoke-ci-gate/outputs/phase-11/evidence"
if [[ "$ENVIRONMENT" == "production" ]]; then
  OUT_DIR_DEFAULT="docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/outputs/phase-11/evidence"
fi
OUT_DIR="$OUT_DIR_DEFAULT"
CI_SUMMARY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out-dir)
      OUT_DIR="${2:-}"
      if [[ -z "$OUT_DIR" ]]; then
        echo "--out-dir requires a path" >&2
        exit 2
      fi
      shift 2
      ;;
    --ci-summary)
      CI_SUMMARY=1
      shift
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

resolve_env_vars() {
  ENV_PREFIX="$(smoke_env_prefix "$ENVIRONMENT")"
  WEB_BASE_VAR="${ENV_PREFIX}_WEB_BASE"
  SESSION_COOKIE_VAR="${ENV_PREFIX}_ADMIN_SESSION_COOKIE"
  WEB_BASE="${!WEB_BASE_VAR:-}"
  ADMIN_SESSION_COOKIE="${!SESSION_COOKIE_VAR:-}"
  if [[ -z "$WEB_BASE" ]]; then
    echo "$WEB_BASE_VAR is required" >&2
    exit 2
  fi
  if [[ -z "$ADMIN_SESSION_COOKIE" ]]; then
    echo "$SESSION_COOKIE_VAR is required" >&2
    exit 2
  fi
  BASE="${WEB_BASE%/}"
  WORKER_NAME_VAR="${ENV_PREFIX}_WORKER_NAME"
  CF_WORKER_NAME="${CF_WORKER_NAME:-${!WORKER_NAME_VAR:-ubm-hyogo-web-${ENVIRONMENT}}}"
  TARGET_ALLOW_REGEX_VAR="${ENV_PREFIX}_WEB_HOST_ALLOW_REGEX"
  TARGET_ALLOW_REGEX="${!TARGET_ALLOW_REGEX_VAR:-${ENVIRONMENT}|127\\.0\\.0\\.1|localhost}"
  if [[ "$ENVIRONMENT" == "production" ]]; then
    TARGET_ALLOW_REGEX="${!TARGET_ALLOW_REGEX_VAR:-ubm-hyogo-web-production\\.|workers\\.dev}"
  fi
}

resolve_env_vars

OUT_LOG="$OUT_DIR/runtime-smoke.log"
SUMMARY_JSON="$OUT_DIR/summary.json"
TMP_DIR="$(mktemp -d)"
DIGEST="${ADMIN_RENDER_ERROR_DIGEST:-167275886}"
TAIL_FILE="$TMP_DIR/cf-tail.log"
TAIL_PID=""
TAIL_STARTED=0
TAIL_COLLECTED=0
umask 077
cleanup() {
  if [[ -n "$TAIL_PID" ]] && kill -0 "$TAIL_PID" >/dev/null 2>&1; then
    kill "$TAIL_PID" >/dev/null 2>&1 || true
    wait "$TAIL_PID" >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$OUT_DIR"
: > "$OUT_LOG"

smoke_summary_init

write_summary() {
  smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"
}

record_check() {
  local label="$1"
  local status="$2"
  local http="$3"
  local reason="${4:-}"
  SMOKE_SUMMARY_ENTRIES+=("$(jq -cn \
    --arg label "$label" \
    --arg status "$status" \
    --arg http "$http" \
    --arg reason "$reason" \
    '{label:$label,status:$status,http:$http,reason:$reason}')")
}

fail_and_exit() {
  local label="$1"
  local http="$2"
  local reason="$3"
  local exit_code="${4:-1}"
  collect_tail 0
  SMOKE_OVERALL_STATUS="FAIL"
  record_check "$label" "FAIL" "$http" "$reason"
  write_summary
  echo "FAIL: $label http=$http reason=$reason" >&2
  exit "$exit_code"
}

assert_target() {
  if ! smoke_assert_host_allow "$BASE" "$TARGET_ALLOW_REGEX"; then
    fail_and_exit "target-allowlist" "000" "target-not-${ENVIRONMENT}" 2
  fi
}

start_tail() {
  TAIL_STARTED=1
  : > "$TAIL_FILE"
  if [[ -n "${CF_TAIL_FILE:-}" ]]; then
    cat "$CF_TAIL_FILE" > "$TAIL_FILE"
  else
    bash "$SCRIPT_DIR/../cf.sh" tail "$CF_WORKER_NAME" --env "$ENVIRONMENT" --format json > "$TAIL_FILE" 2>&1 &
    TAIL_PID="$!"
    sleep "${CF_TAIL_WARMUP_SECONDS:-2}"
  fi
}

collect_tail() {
  local fail_on_render_error="${1:-1}"
  local tail_exit=0
  if [[ "$TAIL_STARTED" -ne 1 ]] || [[ "$TAIL_COLLECTED" -eq 1 ]]; then
    return 0
  fi
  if [[ -n "$TAIL_PID" ]]; then
    set +e
    wait "$TAIL_PID"
    tail_exit=$?
    set -e
    TAIL_PID=""
    if [[ "$tail_exit" -ne 0 ]]; then
      printf 'cf-tail-exit=%s\n' "$tail_exit" >> "$TAIL_FILE"
    fi
  fi
  TAIL_COLLECTED=1
  smoke_redact_filter "$OUT_LOG" < "$TAIL_FILE"
  if grep -Eiq "error\.boundary\.caught|digest[=: ]+${DIGEST}|${DIGEST}" "$TAIL_FILE"; then
    if [[ "$fail_on_render_error" -eq 0 ]]; then
      return 0
    fi
    fail_and_exit "workers-tail" "200" "server-components-render-error"
  fi
  record_check "workers-tail" "PASS" "200" ""
}

request_admin() {
  local body_file="$TMP_DIR/admin.body"
  local status
  set +e
  status="$(
    curl -sS \
      --max-time 30 \
      -o "$body_file" \
      -w "%{http_code}" \
      -H "Cookie: $ADMIN_SESSION_COOKIE" \
      "$BASE/admin"
  )"
  local curl_exit=$?
  set -e
  if [[ "$curl_exit" -ne 0 ]]; then
    status="000"
  fi

  {
    printf '===== admin GET =====\n'
    printf 'status=%s\n' "$status"
    printf 'body=%s\n\n' "$(head -c 2000 "$body_file" | tr -d '\0' | bash "$SMOKE_REDACT")"
  } >> "$OUT_LOG"

  case "$status" in
    200) ;;
    301|302|303|307|308) fail_and_exit "admin-web" "$status" "auth-token-invalid-or-expired" ;;
    403) fail_and_exit "admin-web" "$status" "auth-not-admin" ;;
    *) fail_and_exit "admin-web" "$status" "admin-web-non-200" ;;
  esac

  if grep -Eiq "Server Components render|digest[=: ]+${DIGEST}|${DIGEST}" "$body_file"; then
    fail_and_exit "admin-web" "$status" "server-components-render-error"
  fi
  record_check "admin-web" "PASS" "$status" ""
}

assert_target
start_tail
request_admin
collect_tail
write_summary
echo "runtime admin web smoke PASS" >> "$OUT_LOG"
echo "runtime admin web smoke PASS"
