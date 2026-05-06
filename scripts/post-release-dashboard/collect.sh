#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "usage: $0 <UTC-yyyy-mm-dd> [lookback_hours]" >&2
  exit 64
fi

TARGET_DATE="$1"
LOOKBACK_HOURS="${2:-24}"

case "$TARGET_DATE" in
  ????-??-??) ;;
  *) echo "target date must be yyyy-mm-dd" >&2; exit 64 ;;
esac

case "$LOOKBACK_HOURS" in
  ''|*[!0-9]*) echo "lookback_hours must be an integer" >&2; exit 64 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="outputs/post-release-dashboard/${TARGET_DATE}"
mkdir -p "$OUT_DIR"

source "$SCRIPT_DIR/lib/cf-graphql.sh"
source "$SCRIPT_DIR/lib/d1-metrics.sh"
source "$SCRIPT_DIR/lib/cron-status.sh"
source "$SCRIPT_DIR/lib/format-dashboard.sh"

WORKERS_REQ_JSON="$(cf_graphql_workers_requests "$TARGET_DATE" "$LOOKBACK_HOURS")"
WORKERS_ERR_JSON="$(cf_graphql_workers_errors "$TARGET_DATE" "$LOOKBACK_HOURS")"
D1_READS_JSON="$(d1_metrics_reads "$TARGET_DATE" "$LOOKBACK_HOURS")"
D1_WRITES_JSON="$(d1_metrics_writes "$TARGET_DATE" "$LOOKBACK_HOURS")"
CRON_STATUS_JSON="$(cron_status_latest)"

format_dashboard \
  "$TARGET_DATE" "$LOOKBACK_HOURS" \
  "$WORKERS_REQ_JSON" "$WORKERS_ERR_JSON" \
  "$D1_READS_JSON" "$D1_WRITES_JSON" \
  "$CRON_STATUS_JSON" \
  > "$OUT_DIR/dashboard.json"

format_dashboard_markdown < "$OUT_DIR/dashboard.json" > "$OUT_DIR/dashboard.md"

echo "wrote $OUT_DIR/dashboard.json"
echo "wrote $OUT_DIR/dashboard.md"
