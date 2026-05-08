#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:?env required}"
if [[ "$ENVIRONMENT" != "staging" ]]; then
  echo "Only staging runtime smoke is allowed" >&2
  exit 2
fi

: "${STAGING_API_BASE:?STAGING_API_BASE is required}"
: "${STAGING_ADMIN_BEARER:?STAGING_ADMIN_BEARER is required}"
: "${STAGING_MEMBER_ID:?STAGING_MEMBER_ID is required}"
: "${STAGING_ME_BEARER:?STAGING_ME_BEARER is required}"

OUT_DIR="docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence"
OUT_LOG="$OUT_DIR/runtime-smoke.log"
TMP_DIR="$(mktemp -d)"
umask 077
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$OUT_DIR"
: > "$OUT_LOG"

request_json() {
  local label="$1"
  local url="$2"
  local bearer="$3"
  local jq_filter="$4"
  local summary_filter="$5"
  local body_file="$TMP_DIR/$label.body"
  local status
  local summary

  status="$(
    curl -sS \
      -o "$body_file" \
      -w "%{http_code}" \
      -H "authorization: Bearer $bearer" \
      "$url"
  )"

  if [[ "$status" != "200" ]]; then
    echo "FAIL: $label returned HTTP $status" >&2
    {
      printf '===== %s GET =====\n' "$label"
      printf 'status=%s\n' "$status"
      printf 'contract=%s\n\n' "$jq_filter"
    } >> "$OUT_LOG"
    exit 1
  fi

  if ! jq -e "$jq_filter" "$body_file" >/dev/null; then
    echo "FAIL: $label JSON contract mismatch: $jq_filter" >&2
    {
      printf '===== %s GET =====\n' "$label"
      printf 'status=%s\n' "$status"
      printf 'contract=%s\n\n' "$jq_filter"
    } >> "$OUT_LOG"
    exit 1
  fi

  summary="$(jq -r "$summary_filter" "$body_file")"
  {
    printf '===== %s GET =====\n' "$label"
    printf 'status=%s\n' "$status"
    printf 'contract=%s\n' "$jq_filter"
    printf 'summary=%s\n' "$summary"
    printf 'PASS %s\n\n' "$label"
  } >> "$OUT_LOG"
}

BASE="${STAGING_API_BASE%/}"
MEMBER_ID="$STAGING_MEMBER_ID"

request_json "admin-list" "$BASE/admin/members" "$STAGING_ADMIN_BEARER" '.members | type == "array"' '.members | length'
request_json "admin-detail" "$BASE/admin/members/$MEMBER_ID" "$STAGING_ADMIN_BEARER" '.attendance | type == "array"' '.attendance | length'
request_json "admin-attendance" "$BASE/admin/members/$MEMBER_ID/attendance" "$STAGING_ADMIN_BEARER" '.records | type == "array"' '.records | length'
request_json "me-root" "$BASE/me/" "$STAGING_ME_BEARER" '.user.memberId | type == "string"' '.user.memberId | type'
request_json "me-profile" "$BASE/me/profile" "$STAGING_ME_BEARER" '.profile.attendance | type == "array"' '.profile.attendance | length'
request_json "me-attendance" "$BASE/me/attendance" "$STAGING_ME_BEARER" '.records | type == "array"' '.records | length'

echo "runtime attendance provider smoke PASS" >> "$OUT_LOG"
echo "runtime attendance provider smoke PASS"
