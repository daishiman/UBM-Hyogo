#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/format-dashboard.sh"

json="$(format_dashboard \
  "2026-05-05" "24" \
  '{"value":4999,"unit":"req/24h","source_endpoint":"fixture"}' \
  '{"value":51,"unit":"err/24h","source_endpoint":"fixture"}' \
  '{"value":40001,"unit":"reads/24h","source_endpoint":"fixture"}' \
  '{"value":10000,"unit":"writes/24h","source_endpoint":"fixture"}' \
  '{"latest_run_id":1,"conclusion":"failure","run_started_at":"2026-05-05T00:00:00Z"}')"

jq -e '
  (.metrics[] | select(.metric_id=="workers_requests").judgment) == "WARN" and
  (.metrics[] | select(.metric_id=="workers_errors").judgment) == "FAIL" and
  (.metrics[] | select(.metric_id=="d1_reads").judgment) == "WARN" and
  (.metrics[] | select(.metric_id=="d1_writes").judgment) == "WARN" and
  (.metrics[] | select(.metric_id=="cron_status").judgment) == "FAIL"
' <<<"$json" >/dev/null
