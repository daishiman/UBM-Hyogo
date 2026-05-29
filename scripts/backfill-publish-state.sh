#!/usr/bin/env bash
# members-not-displaying-form-sync-investigation Task C:
# POST /admin/sync/backfill-publish-state を叩く ops script。
# default は --dry-run。--apply は対話的に "yes" 確認を要求する。
# token 値は絶対にログ出力しない。
set -euo pipefail

ENV="staging"
MODE="dry-run"

usage() {
  cat <<'EOF' >&2
usage: backfill-publish-state.sh [--env staging|production] [--dry-run|--apply]
required env:
  SYNC_ADMIN_TOKEN  Bearer token (never echoed)
optional env:
  API_BASE_URL      override base URL (default: derived from --env)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV="${2:?}"; shift 2 ;;
    --dry-run) MODE="dry-run"; shift ;;
    --apply) MODE="apply"; shift ;;
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
  echo "ERROR: SYNC_ADMIN_TOKEN must be set" >&2
  exit 1
fi

if [[ "$MODE" == "apply" ]]; then
  echo "[backfill] env=$ENV MODE=APPLY (will UPDATE rows)" >&2
  read -r -p "type 'yes' to proceed: " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "[backfill] aborted" >&2
    exit 1
  fi
  QS="?dryRun=false"
else
  echo "[backfill] env=$ENV MODE=dry-run (no UPDATE)" >&2
  QS="?dryRun=true"
fi

URL="$BASE_URL/admin/sync/backfill-publish-state$QS"
echo "[backfill] POST $URL" >&2

RESP="$(curl --fail --silent --show-error -X POST \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}" \
  "$URL")"

if command -v jq >/dev/null 2>&1; then
  echo "$RESP" | jq
else
  echo "$RESP"
fi
