#!/usr/bin/env bash
set -euo pipefail

d1_metrics_reads() {
  local target_date="$1"
  local lookback_hours="$2"
  if post_release_fixture_json d1-reads; then
    return 0
  fi
  local window
  window="$(post_release_time_window_json "$target_date" "$lookback_hours")"
  local query='query D1Reads($accountTag: String!, $since: Time!, $until: Time!) { viewer { accounts(filter: { accountTag: $accountTag }) { d1AnalyticsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $since, datetime_lt: $until }) { sum { readQueries } } } } }'
  local variables
  variables="$(jq -nc --arg accountTag "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}" --argjson window "$window" '{accountTag:$accountTag,since:$window.since,until:$window.until}')"
  local response value
  response="$(post_release_cf_graphql "$query" "$variables")"
  value="$(jq '[.data.viewer.accounts[].d1AnalyticsAdaptiveGroups[].sum.readQueries // 0] | add // 0' <<<"$response")"
  post_release_metric_json "$value" "reads/24h" "graphql:d1AnalyticsAdaptiveGroups"
}

d1_metrics_writes() {
  local target_date="$1"
  local lookback_hours="$2"
  if post_release_fixture_json d1-writes; then
    return 0
  fi
  local window
  window="$(post_release_time_window_json "$target_date" "$lookback_hours")"
  local query='query D1Writes($accountTag: String!, $since: Time!, $until: Time!) { viewer { accounts(filter: { accountTag: $accountTag }) { d1AnalyticsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $since, datetime_lt: $until }) { sum { writeQueries } } } } }'
  local variables
  variables="$(jq -nc --arg accountTag "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}" --argjson window "$window" '{accountTag:$accountTag,since:$window.since,until:$window.until}')"
  local response value
  response="$(post_release_cf_graphql "$query" "$variables")"
  value="$(jq '[.data.viewer.accounts[].d1AnalyticsAdaptiveGroups[].sum.writeQueries // 0] | add // 0' <<<"$response")"
  post_release_metric_json "$value" "writes/24h" "graphql:d1AnalyticsAdaptiveGroups"
}
