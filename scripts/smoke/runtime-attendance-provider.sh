#!/usr/bin/env bash
# attendanceProvider runtime smoke runner.
#
# Usage:
#   runtime-attendance-provider.sh <env> [--out-dir <path>] [--ci-summary]
#
# Args:
#   env          : "staging" 固定（其他は exit 2）
#   --out-dir    : 出力 dir（省略時 docs/30-workflows/issue-531-...../evidence）
#   --ci-summary : 追加で summary.json を出力（CI artifact 用）
#
# Required env:
#   STAGING_API_BASE / STAGING_ADMIN_BEARER / STAGING_MEMBER_ID / STAGING_ME_BEARER
#
# Exit:
#   0 : 全 route PASS
#   1 : route が non-200 / contract 違反
#   2 : 引数不正・必須 env 欠落
set -euo pipefail

ENVIRONMENT="${1:-}"
shift || true
if [[ -z "$ENVIRONMENT" ]]; then
  echo "env required" >&2
  exit 2
fi
if [[ "$ENVIRONMENT" != "staging" ]]; then
  echo "Only staging runtime smoke is allowed" >&2
  exit 2
fi

OUT_DIR_DEFAULT="docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence"
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

: "${STAGING_API_BASE:?STAGING_API_BASE is required}"
: "${STAGING_ADMIN_BEARER:?STAGING_ADMIN_BEARER is required}"
: "${STAGING_MEMBER_ID:?STAGING_MEMBER_ID is required}"
: "${STAGING_ME_BEARER:?STAGING_ME_BEARER is required}"

OUT_LOG="$OUT_DIR/runtime-smoke.log"
SUMMARY_JSON="$OUT_DIR/summary.json"
TMP_DIR="$(mktemp -d)"
umask 077
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$OUT_DIR"
: > "$OUT_LOG"

# summary entries (jq で結合する想定)
SUMMARY_ENTRIES=()
OVERALL_STATUS="PASS"

write_summary() {
  if [[ "$CI_SUMMARY" -ne 1 ]]; then
    return 0
  fi
  local entries_csv
  entries_csv="$(IFS=,; echo "${SUMMARY_ENTRIES[*]:-}")"
  printf '{"status":"%s","routes":[%s]}\n' "$OVERALL_STATUS" "$entries_csv" > "$SUMMARY_JSON"
}

assert_staging_target() {
  local allow_regex="${STAGING_API_HOST_ALLOW_REGEX:-staging|127\\.0\\.0\\.1|localhost}"
  local marker_body="$TMP_DIR/staging-marker.body"
  local marker_status

  if ! printf '%s\n' "$BASE" | grep -Eiq "$allow_regex"; then
    fail_and_exit "target-allowlist" "000" "STAGING_API_BASE must match $allow_regex"
  fi

  set +e
  marker_status="$(
    curl -sS \
      --max-time 15 \
      -o "$marker_body" \
      -w "%{http_code}" \
      "$BASE/"
  )"
  local marker_exit=$?
  set -e
  if [[ "$marker_exit" -ne 0 ]]; then
    marker_status="000"
  fi
  if [[ "$marker_status" != "200" ]]; then
    fail_and_exit "target-marker" "$marker_status" '.environment == "staging"'
  fi
  if ! jq -e '.environment == "staging"' "$marker_body" >/dev/null 2>&1; then
    fail_and_exit "target-marker" "$marker_status" '.environment == "staging"'
  fi
}

fail_and_exit() {
  local label="$1"
  local status="$2"
  local jq_filter="$3"
  OVERALL_STATUS="FAIL"
  SUMMARY_ENTRIES+=("$(printf '{"label":"%s","status":"FAIL","http":"%s","contract":%s}' "$label" "$status" "$(printf '%s' "$jq_filter" | jq -Rs .)")")
  write_summary
  echo "FAIL: $label http=$status contract=$jq_filter" >&2
  exit 1
}

request_json() {
  local label="$1"
  local url="$2"
  local bearer="$3"
  local jq_filter="$4"
  local summary_filter="$5"
  local body_file="$TMP_DIR/$label.body"
  local status
  local summary

  set +e
  status="$(
    curl -sS \
      --max-time 30 \
      -o "$body_file" \
      -w "%{http_code}" \
      -H "authorization: Bearer $bearer" \
      "$url"
  )"
  local curl_exit=$?
  set -e
  if [[ "$curl_exit" -ne 0 ]]; then
    status="000"
  fi

  if [[ "$status" != "200" ]]; then
    {
      printf '===== %s GET =====\n' "$label"
      printf 'status=%s\n' "$status"
      printf 'contract=%s\n\n' "$jq_filter"
    } >> "$OUT_LOG"
    fail_and_exit "$label" "$status" "$jq_filter"
  fi

  if ! jq -e "$jq_filter" "$body_file" >/dev/null 2>&1; then
    {
      printf '===== %s GET =====\n' "$label"
      printf 'status=%s\n' "$status"
      printf 'contract=%s\n\n' "$jq_filter"
    } >> "$OUT_LOG"
    fail_and_exit "$label" "$status" "$jq_filter"
  fi

  summary="$(jq -r "$summary_filter" "$body_file")"
  {
    printf '===== %s GET =====\n' "$label"
    printf 'status=%s\n' "$status"
    printf 'contract=%s\n' "$jq_filter"
    printf 'summary=%s\n' "$summary"
    printf 'PASS %s\n\n' "$label"
  } >> "$OUT_LOG"

  SUMMARY_ENTRIES+=("$(printf '{"label":"%s","status":"PASS","http":"%s","summary":%s}' "$label" "$status" "$(printf '%s' "$summary" | jq -Rs .)")")
}

BASE="${STAGING_API_BASE%/}"
MEMBER_ID="$STAGING_MEMBER_ID"

assert_staging_target
request_json "admin-list" "$BASE/admin/members" "$STAGING_ADMIN_BEARER" '.members | type == "array"' '.members | length'
request_json "admin-detail" "$BASE/admin/members/$MEMBER_ID" "$STAGING_ADMIN_BEARER" '.attendance | type == "array"' '.attendance | length'
request_json "admin-attendance" "$BASE/admin/members/$MEMBER_ID/attendance" "$STAGING_ADMIN_BEARER" '.records | type == "array"' '.records | length'
request_json "me-root" "$BASE/me/" "$STAGING_ME_BEARER" '.user.memberId | type == "string"' '.user.memberId | type'
request_json "me-profile" "$BASE/me/profile" "$STAGING_ME_BEARER" '.profile.attendance | type == "array"' '.profile.attendance | length'
request_json "me-attendance" "$BASE/me/attendance" "$STAGING_ME_BEARER" '.records | type == "array"' '.records | length'

echo "runtime attendance provider smoke PASS" >> "$OUT_LOG"
write_summary
echo "runtime attendance provider smoke PASS"
