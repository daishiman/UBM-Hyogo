#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

export POST_RELEASE_DASHBOARD_FIXTURE_DIR="$SCRIPT_DIR/fixtures"
cd "$REPO_ROOT"

bash scripts/post-release-dashboard/collect.sh 2026-05-05 24 >/dev/null
cp outputs/post-release-dashboard/2026-05-05/dashboard.json "$TMP_DIR/dashboard.json"
cp outputs/post-release-dashboard/2026-05-05/dashboard.md "$TMP_DIR/dashboard.md"
rm -rf outputs/post-release-dashboard/2026-05-05

jq -e '
  .schema_version == "1" and
  .target_date_utc == "2026-05-05" and
  (.metrics | length) == 5 and
  ([.metrics[].metric_id] == ["workers_requests","workers_errors","d1_reads","d1_writes","cron_status"]) and
  ([.metrics[].judgment] | all(. as $j | ["PASS","WARN","FAIL","UNKNOWN"] | index($j)))
' "$TMP_DIR/dashboard.json" >/dev/null

rg -F "Workers requests" "$TMP_DIR/dashboard.md" >/dev/null
rg -F "D1 reads" "$TMP_DIR/dashboard.md" >/dev/null
rg -F "D1 writes" "$TMP_DIR/dashboard.md" >/dev/null
