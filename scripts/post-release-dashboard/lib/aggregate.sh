#!/usr/bin/env bash
# 集計関連ヘルパ。

# aggregate_runs <runs_json_path>
# stdout: 集計 JSON
aggregate_runs() {
  local runs="$1"
  jq -s '
    .[0] as $rs
    | ([$rs[] | select(.event=="schedule")] | sort_by(.createdAt)) as $schedule
    | ([$schedule[] | .createdAt[0:10]] | unique | sort) as $schedule_dates
    | (
        if ($schedule_dates | length) < 2
        then 0
        else
          [range(1; $schedule_dates | length) as $i
            | (((($schedule_dates[$i] + "T00:00:00Z") | fromdateiso8601) - (($schedule_dates[$i - 1] + "T00:00:00Z") | fromdateiso8601)) / 86400 | floor) - 1
            | select(. > 0)
          ] | add // 0
        end
      ) as $missing_schedule_gap_days
    | ([$schedule[] | select(.conclusion=="failure")] | length) as $failure_count
    | {
        runs_total: ($rs | length),
        schedule_runs_total: ($schedule | length),
        schedule_days_total: ($schedule_dates | length),
        missing_schedule_gap_days: $missing_schedule_gap_days,
        oldest_schedule_created_at: ([$schedule[] | .createdAt] | min // ""),
        conclusion_dist: ([$schedule[] | .conclusion] | group_by(.) | map({key: .[0], value: length}) | from_entries),
        failure_cause_dist: (
          if $failure_count == 0
          then {}
          else {"workflow_failure_unclassified": $failure_count}
          end
        ),
        failure_run_urls: ([$schedule[] | select(.conclusion=="failure") | .url]),
        failure_rate: (
          if ($schedule|length) == 0 then 0 else ($failure_count / ($schedule|length)) end
        ),
        longest_failure_streak: (
          [$schedule[] | .conclusion]
          | reduce .[] as $c ({cur:0,max:0}; if $c=="failure" then {cur:(.cur+1), max:([.max,(.cur+1)]|max)} else {cur:0,max:.max} end)
          | .max
        )
      }
  ' "$runs"
}
