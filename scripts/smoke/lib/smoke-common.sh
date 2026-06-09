#!/usr/bin/env bash
# Shared helpers for scripts/smoke runtime runners.
#
# This file is sourced by runners that already set shell options. It must not
# set `set -euo pipefail` or register traps; process lifecycle remains owned by
# each runner.
# shellcheck shell=bash

SMOKE_OVERALL_STATUS="${SMOKE_OVERALL_STATUS:-PASS}"
SMOKE_SUMMARY_ENTRIES=()
SMOKE_REDACT="${SMOKE_REDACT:-}"

smoke_redact_filter() {
  local out_log="$1"
  bash "$SMOKE_REDACT" >> "$out_log"
}

smoke_redact_line() {
  local out_log="$1"
  shift
  printf '%s\n' "$*" | smoke_redact_filter "$out_log"
}

smoke_summary_init() {
  SMOKE_OVERALL_STATUS="PASS"
  SMOKE_SUMMARY_ENTRIES=()
}

smoke_summary_pass() {
  local label="$1"
  SMOKE_SUMMARY_ENTRIES+=("$(jq -cn --arg label "$label" '{label:$label,status:"PASS"}')")
}

smoke_summary_fail_entry() {
  local label="$1"
  local status="$2"
  local contract="$3"
  local reason="${4:-}"
  SMOKE_OVERALL_STATUS="FAIL"
  if [[ -n "$reason" ]]; then
    SMOKE_SUMMARY_ENTRIES+=("$(jq -cn \
      --arg label "$label" \
      --arg http "$status" \
      --arg contract "$contract" \
      --arg reason "$reason" \
      '{label:$label,status:"FAIL",http:$http,contract:$contract,reason:$reason}')")
  else
    SMOKE_SUMMARY_ENTRIES+=("$(jq -cn \
      --arg label "$label" \
      --arg http "$status" \
      --arg contract "$contract" \
      '{label:$label,status:"FAIL",http:$http,contract:$contract}')")
  fi
}

smoke_write_summary() {
  local ci_flag="$1"
  local json_path="$2"
  local array_key="$3"
  if [[ "$ci_flag" -ne 1 || -z "$json_path" ]]; then
    return 0
  fi
  local entries_csv
  entries_csv="$(IFS=,; echo "${SMOKE_SUMMARY_ENTRIES[*]:-}")"
  printf '{"status":"%s","%s":[%s]}\n' "$SMOKE_OVERALL_STATUS" "$array_key" "$entries_csv" > "$json_path"
}

smoke_assert_host_allow() {
  local base="$1"
  local allow_regex="$2"
  printf '%s\n' "$base" | grep -Eiq "$allow_regex"
}

smoke_env_prefix() {
  printf '%s' "$1" | tr '[:lower:]' '[:upper:]'
}

smoke_run_d1() {
  local cf_sh="$1"
  local database="$2"
  local environment="$3"
  shift 3
  bash "$cf_sh" d1 execute "$database" --env "$environment" --remote "$@"
}
