#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# shellcheck disable=SC1091
. "$SCRIPT_DIR/lib/api-url-guard.sh"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/lib/evidence-summary.sh"
# shellcheck disable=SC1091
. "$REPO_ROOT/scripts/lib/redaction.sh"

ENV_NAME="production"
DRY_RUN=0
READONLY=0
OUTPUT_DIR=""

usage() {
  cat <<'USAGE'
Usage: run-smoke.sh --env production|staging --readonly [--dry-run] [--output-dir DIR]

Production requires PRODUCTION_API_URL. Staging requires STAGING_API_URL.
Real smoke reads missing session cookies from stdin with read -s. Dry-run
validates URL selection and redaction plumbing without session values or network calls.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env)
      ENV_NAME="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --readonly)
      READONLY=1
      shift
      ;;
    --output-dir)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'runtime-smoke: unknown argument %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ "$ENV_NAME" != "production" ] && [ "$ENV_NAME" != "staging" ]; then
  printf 'runtime-smoke: --env must be production or staging\n' >&2
  exit 2
fi

if [ "$READONLY" -ne 1 ]; then
  printf 'runtime-smoke: --readonly is required for attendance smoke\n' >&2
  exit 2
fi

if [ "$ENV_NAME" = "production" ]; then
  API_URL="${PRODUCTION_API_URL:-}"
else
  API_URL="${STAGING_API_URL:-}"
fi

require_api_url "$ENV_NAME" "$API_URL" "${STAGING_API_URL:-}"

if [ -z "$OUTPUT_DIR" ]; then
  OUTPUT_DIR="$REPO_ROOT/docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-11"
fi
EVIDENCE_DIR="$OUTPUT_DIR/evidence"

mkdir -p "$OUTPUT_DIR" "$EVIDENCE_DIR"

if [ "$DRY_RUN" -eq 1 ]; then
  {
    printf 'runtime-smoke dry-run\n'
    printf 'env=%s\n' "$ENV_NAME"
    printf 'api_host=%s\n' "$(printf '%s' "$API_URL" | sed -E 's#^https?://([^/]+).*#\1#')"
    printf 'readonly=true\n'
    printf 'endpoints=/admin/members,/admin/members/:memberId,/me/profile,/me/attendance\n'
  } | redact_stream | tee "$EVIDENCE_DIR/${ENV_NAME}-smoke-dry-run.log"
  exit 0
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  unset ADMIN_SESSION_COOKIE MEMBER_SESSION_COOKIE
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

if [ -z "${ADMIN_SESSION_COOKIE:-}" ]; then
  read -r -s -p "Admin session cookie: " ADMIN_SESSION_COOKIE
  printf '\n' >&2
fi
if [ -z "${MEMBER_SESSION_COOKIE:-}" ]; then
  read -r -s -p "Member session cookie: " MEMBER_SESSION_COOKIE
  printf '\n' >&2
fi

SUMMARY="$OUTPUT_DIR/production-smoke-summary.md"
{
  printf '# Production Attendance Smoke Summary\n\n'
  printf '| item | value |\n| --- | --- |\n'
  printf '| env | %s |\n' "$ENV_NAME"
  printf '| executed_at_utc | %s |\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '| readonly | true |\n\n'
  printf '## Endpoint Summary\n\n'
} > "$SUMMARY"

curl_json() {
  local name="$1" path="$2" cookie="$3"
  local out="$TMP_DIR/$name.json"
  local status
  status="$(curl -sS -o "$out" -w '%{http_code}' -X GET "$API_URL$path" -H "Cookie: $cookie")"
  printf '| %s | http_status | %s |\n' "$path" "$status" >> "$SUMMARY"
  if [ "$status" != "200" ]; then
    printf 'runtime-smoke: %s returned HTTP %s\n' "$path" "$status" >&2
    return 1
  fi
  summarize_json "$name" "$out" | redact_stream >> "$SUMMARY"
}

curl_json admin-members "/admin/members?limit=5" "$ADMIN_SESSION_COOKIE"

MEMBER_ID="${SMOKE_MEMBER_ID:-}"
if [ -z "$MEMBER_ID" ]; then
  MEMBER_ID="$(jq -r '.items[0].id // .members[0].id // empty' "$TMP_DIR/admin-members.json")"
fi
if [ -z "$MEMBER_ID" ]; then
  printf 'runtime-smoke: could not derive SMOKE_MEMBER_ID from /admin/members summary\n' >&2
  exit 1
fi

curl_json admin-member-detail "/admin/members/$MEMBER_ID" "$ADMIN_SESSION_COOKIE"
curl_json me-profile "/me/profile" "$MEMBER_SESSION_COOKIE"
curl_json me-attendance "/me/attendance" "$MEMBER_SESSION_COOKIE"

if grep -E -q -r '(Bearer [A-Za-z0-9._-]+|__Secure-|_cfuvid=|_cf_bm=|[A-Za-z0-9._%+-]+@(gmail\.com|senpai-lab\.com)|"fullName"[[:space:]]*:)' "$SUMMARY" "$EVIDENCE_DIR"; then
  printf 'grep_exit=0\nsensitive_pattern_hit=true\n' > "$OUTPUT_DIR/redact-filter-zero-hit.log"
  printf 'runtime-smoke: redaction grep found sensitive output\n' >&2
  exit 1
fi
printf 'grep_exit=1\n0 hit\n' > "$OUTPUT_DIR/redact-filter-zero-hit.log"
