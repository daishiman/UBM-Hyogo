#!/usr/bin/env bash
set -euo pipefail

post_release_fixture_json() {
  local name="$1"
  if [ -n "${POST_RELEASE_DASHBOARD_FIXTURE_DIR:-}" ] && [ -f "${POST_RELEASE_DASHBOARD_FIXTURE_DIR}/${name}.json" ]; then
    cat "${POST_RELEASE_DASHBOARD_FIXTURE_DIR}/${name}.json"
    return 0
  fi
  return 1
}

post_release_time_window_json() {
  local target_date="$1"
  local lookback_hours="$2"
  node -e '
    const [targetDate, hours] = process.argv.slice(1);
    const until = new Date(`${targetDate}T00:00:00Z`);
    const since = new Date(until.getTime() - Number(hours) * 60 * 60 * 1000);
    process.stdout.write(JSON.stringify({ since: since.toISOString(), until: until.toISOString() }));
  ' "$target_date" "$lookback_hours"
}

post_release_cf_graphql() {
  local query="$1"
  local variables="$2"
  curl -fsS -X POST \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}" \
    -H "Content-Type: application/json" \
    --data "$(jq -nc --arg query "$query" --argjson variables "$variables" '{query:$query,variables:$variables}')" \
    "https://api.cloudflare.com/client/v4/graphql"
}

post_release_metric_json() {
  local value="$1"
  local unit="$2"
  local source_endpoint="$3"
  jq -nc --argjson value "$value" --arg unit "$unit" --arg source_endpoint "$source_endpoint" \
    '{value:$value,unit:$unit,source_endpoint:$source_endpoint}'
}

cf_graphql_workers_requests() {
  local target_date="$1"
  local lookback_hours="$2"
  if post_release_fixture_json workers-requests; then
    return 0
  fi
  local window
  window="$(post_release_time_window_json "$target_date" "$lookback_hours")"
  local query='query WorkersReq($accountTag: String!, $since: Time!, $until: Time!) { viewer { accounts(filter: { accountTag: $accountTag }) { httpRequestsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $since, datetime_lt: $until }) { sum { requests } } } } }'
  local variables
  variables="$(jq -nc --arg accountTag "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}" --argjson window "$window" '{accountTag:$accountTag,since:$window.since,until:$window.until}')"
  local response value
  response="$(post_release_cf_graphql "$query" "$variables")"
  value="$(jq '[.data.viewer.accounts[].httpRequestsAdaptiveGroups[].sum.requests // 0] | add // 0' <<<"$response")"
  post_release_metric_json "$value" "req/24h" "graphql:httpRequestsAdaptiveGroups"
}

cf_graphql_workers_errors() {
  local target_date="$1"
  local lookback_hours="$2"
  if post_release_fixture_json workers-errors; then
    return 0
  fi
  local window
  window="$(post_release_time_window_json "$target_date" "$lookback_hours")"
  local query='query WorkersErrors($accountTag: String!, $since: Time!, $until: Time!) { viewer { accounts(filter: { accountTag: $accountTag }) { httpRequestsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $since, datetime_lt: $until }) { sum { errors } } } } }'
  local variables
  variables="$(jq -nc --arg accountTag "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}" --argjson window "$window" '{accountTag:$accountTag,since:$window.since,until:$window.until}')"
  local response value
  response="$(post_release_cf_graphql "$query" "$variables")"
  value="$(jq '[.data.viewer.accounts[].httpRequestsAdaptiveGroups[].sum.errors // 0] | add // 0' <<<"$response")"
  post_release_metric_json "$value" "err/24h" "graphql:httpRequestsAdaptiveGroups"
}
