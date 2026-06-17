#!/usr/bin/env bash
# Authenticated /me runtime smoke runner for the api Worker.
set -euo pipefail

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

OUT_DIR="ci-evidence"
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

upper="$(printf '%s' "$ENVIRONMENT" | tr '[:lower:]' '[:upper:]')"
api_base_var="${upper}_API_BASE"
cookie_var="${upper}_ADMIN_SESSION_COOKIE"
api_base="${!api_base_var:-}"
admin_session_cookie="${!cookie_var:-}"
if [[ -z "$api_base" ]]; then
  echo "$api_base_var is required" >&2
  exit 2
fi
if [[ -z "$admin_session_cookie" ]]; then
  echo "$cookie_var is required" >&2
  exit 2
fi

base="${api_base%/}"
allow_regex_var="${upper}_API_HOST_ALLOW_REGEX"
allow_regex="${!allow_regex_var:-${ENVIRONMENT}|127\\.0\\.0\\.1|localhost}"
if [[ "$ENVIRONMENT" == "production" ]]; then
  allow_regex="${!allow_regex_var:-ubm-hyogo-api\\.|workers\\.dev}"
fi
if ! [[ "$base" =~ $allow_regex ]]; then
  echo "target-not-${ENVIRONMENT}" >&2
  exit 2
fi

mkdir -p "$OUT_DIR"
out_log="$OUT_DIR/runtime-api-smoke.log"
summary_json="$OUT_DIR/summary.json"
: > "$out_log"

json_escape() {
  jq -Rn --arg value "$1" '$value'
}

write_summary() {
  local status="$1"
  local label="$2"
  local http="$3"
  local reason="${4:-}"
  if [[ "$CI_SUMMARY" -ne 1 ]]; then
    return 0
  fi
  cat > "$summary_json" <<JSON
{"status":"$status","checks":[{"label":$(json_escape "$label"),"status":"$status","http":$(json_escape "$http"),"reason":$(json_escape "$reason")}]}
JSON
}

curl_status() {
  local url="$1"
  local status
  set +e
  status="$(curl -sS --max-time 30 -o /dev/null -w "%{http_code}" -H "Cookie: ${admin_session_cookie}" "$url")"
  local curl_exit=$?
  set -e
  if [[ "$curl_exit" -ne 0 || -z "$status" ]]; then
    status="000"
  fi
  printf '%s' "$status"
}

healthz_status="$(curl_status "$base/me/healthz")"
printf 'me_healthz_status=%s\n' "$healthz_status" >> "$out_log"
if [[ ! "$healthz_status" =~ ^2 ]]; then
  write_summary "FAIL" "api-me-healthz" "$healthz_status" "me-healthz-non-2xx"
  echo "FAIL: api-me-healthz http=$healthz_status" >&2
  exit 1
fi

me_status="$(curl_status "$base/me")"
printf 'me_status=%s\n' "$me_status" >> "$out_log"
if [[ "$me_status" != "200" ]]; then
  write_summary "FAIL" "api-me-authenticated" "$me_status" "authenticated-me-non-200"
  echo "FAIL: api-me-authenticated http=$me_status" >&2
  exit 1
fi

write_summary "PASS" "api-me-authenticated" "$me_status" ""
echo "runtime admin api smoke PASS" >> "$out_log"
echo "runtime admin api smoke PASS"
