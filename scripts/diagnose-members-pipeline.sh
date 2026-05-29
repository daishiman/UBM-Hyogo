#!/usr/bin/env bash
# members-not-displaying-form-sync-investigation Task A:
# /admin/sync/diagnostics/forms-pipeline を SYNC_ADMIN_TOKEN bearer で取得し、
# 主要フィールド（hypothesisFlags / breakdowns / visiblePublicCount / lastSuccessfulSyncAt / totals / diagnosis）
# を jq で要約表示する。token 値は絶対にログ出力しない。
set -euo pipefail

ENV="staging"
RAW=0

usage() {
  cat <<'EOF' >&2
usage: diagnose-members-pipeline.sh [--env staging|production] [--raw]
required env:
  SYNC_ADMIN_TOKEN  Bearer token (never echoed)
optional env:
  API_BASE_URL      override base URL (default: derived from --env)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV="${2:?}"; shift 2 ;;
    --raw) RAW=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown arg: $1" >&2; usage; exit 64 ;;
  esac
done

case "$ENV" in
  staging) DEFAULT_BASE="https://api-staging.ubm-hyogo.workers.dev" ;;
  production) DEFAULT_BASE="https://api.ubm-hyogo.workers.dev" ;;
  *) echo "ERROR: --env must be staging or production" >&2; exit 64 ;;
esac

BASE_URL="${API_BASE_URL:-$DEFAULT_BASE}"

if [[ -z "${SYNC_ADMIN_TOKEN:-}" ]]; then
  echo "ERROR: SYNC_ADMIN_TOKEN environment variable must be set" >&2
  exit 1
fi

URL="$BASE_URL/admin/sync/diagnostics/forms-pipeline"
echo "[diagnose] GET $URL (env=$ENV)" >&2

# curl: token は -H で渡し、stderr/stdout には残さない（--silent）
RESP="$(curl --fail --silent --show-error \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}" \
  "$URL")"

if [[ "$RAW" -eq 1 ]]; then
  echo "$RESP"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq not installed; rerun with --raw or install jq" >&2
  exit 1
fi

echo "$RESP" | jq '{
  capturedAt,
  lastSuccessfulSyncAt,
  visiblePublicCount,
  diagnosis,
  hypothesisFlags,
  publicConsentBreakdown,
  publishStateBreakdown,
  totals
}'
