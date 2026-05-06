#!/usr/bin/env bash
set -euo pipefail

cron_status_latest() {
  if post_release_fixture_json cron-status; then
    return 0
  fi
  if ! command -v gh >/dev/null 2>&1 || [ -z "${GH_TOKEN:-}" ]; then
    jq -nc '{latest_run_id:null,conclusion:null,run_started_at:null}'
    return 0
  fi
  local runs
  runs="$(gh run list --workflow=post-release-dashboard.yml --limit=10 --json databaseId,event,status,conclusion,createdAt 2>/dev/null || true)"
  if [ -z "$runs" ]; then
    jq -nc '{latest_run_id:null,conclusion:null,run_started_at:null}'
    return 0
  fi
  jq -c --arg current "${GITHUB_RUN_ID:-}" '
    [ .[]
      | select(.event == "schedule")
      | select(.status == "completed")
      | select((.databaseId | tostring) != $current)
    ][0] as $run
    | if $run == null then
        {latest_run_id:null,conclusion:null,run_started_at:null}
      else
        {latest_run_id:$run.databaseId,conclusion:$run.conclusion,run_started_at:$run.createdAt}
      end
  ' <<<"$runs"
}
