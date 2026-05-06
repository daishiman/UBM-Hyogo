#!/usr/bin/env bash
set -euo pipefail

format_dashboard() {
  local target_date="$1"
  local lookback_hours="$2"
  local workers_requests="$3"
  local workers_errors="$4"
  local d1_reads="$5"
  local d1_writes="$6"
  local cron_status="$7"
  local collected_at
  collected_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  jq -n \
    --arg collected_at "$collected_at" \
    --arg target_date "$target_date" \
    --argjson lookback_hours "$lookback_hours" \
    --argjson workers_requests "$workers_requests" \
    --argjson workers_errors "$workers_errors" \
    --argjson d1_reads "$d1_reads" \
    --argjson d1_writes "$d1_writes" \
    --argjson cron_status "$cron_status" '
    def numeric_judgment($value; $operator; $threshold):
      if $value == null then "UNKNOWN"
      elif ($operator == "<" and ($value >= $threshold)) or ($operator == "<=" and ($value > $threshold)) then "FAIL"
      elif ($value | type) == "number" and $value >= ($threshold * 0.8) then "WARN"
      else "PASS"
      end;
    def enum_judgment($value; $allowed):
      if $value == null then "UNKNOWN"
      elif ($allowed | index($value)) then "PASS"
      else "FAIL"
      end;
    def metric($id; $label; $input; $operator; $threshold):
      {
        metric_id: $id,
        label: $label,
        value: $input.value,
        unit: $input.unit,
        threshold: {operator: $operator, value: $threshold},
        judgment: numeric_judgment($input.value; $operator; $threshold),
        source_endpoint: $input.source_endpoint,
        source_query_hash: "sha256:runtime"
      };
    {
      "$schema": "https://example.invalid/post-release-dashboard.schema.json",
      schema_version: "1",
      collected_at_utc: $collected_at,
      target_date_utc: $target_date,
      lookback_hours: $lookback_hours,
      release: {
        tag: (env.GITHUB_REF_NAME // null),
        commit: (env.GITHUB_SHA // null),
        deployed_at_utc: null
      },
      metrics: [
        metric("workers_requests"; "Workers requests"; $workers_requests; "<"; 5000),
        metric("workers_errors"; "Workers errors"; $workers_errors; "<="; 50),
        metric("d1_reads"; "D1 reads"; $d1_reads; "<="; 50000),
        metric("d1_writes"; "D1 writes"; $d1_writes; "<="; 10000),
        {
          metric_id: "cron_status",
          label: "Latest schedule run",
          value: ($cron_status.conclusion // null),
          unit: "enum",
          threshold: {operator:"in", value:["success","skipped"]},
          judgment: enum_judgment(($cron_status.conclusion // null); ["success","skipped"]),
          source_endpoint: "github:actions/runs",
          source_query_hash: null
        }
      ],
      notes: []
    }'
}

format_dashboard_markdown() {
  jq -r '
    def threshold_text:
      if .threshold.operator == "in" then "in [" + (.threshold.value | join(", ")) + "]"
      else .threshold.operator + " " + (.threshold.value | tostring)
      end;
    "# Post-release dashboard - " + .target_date_utc + " (UTC)",
    "",
    "| Metric | Value | Unit | Threshold | Judgment |",
    "|---|---:|---|---|---|",
    (.metrics[] | "| " + .label + " | " + (.value | tostring) + " | " + .unit + " | " + threshold_text + " | " + .judgment + " |"),
    "",
    "Collected at: " + .collected_at_utc + " (lookback " + (.lookback_hours | tostring) + "h)"
  '
}
