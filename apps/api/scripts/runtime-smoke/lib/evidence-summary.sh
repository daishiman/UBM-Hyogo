#!/usr/bin/env bash
# shellcheck shell=bash

summarize_json() {
  local endpoint="$1" input_file="$2"

  case "$endpoint" in
    admin-members)
      jq -c '{endpoint:"/admin/members", response_type:(type), top_keys_count:(keys | length)}' "$input_file"
      ;;
    admin-member-detail)
      jq -e -c '
        {endpoint:"/admin/members/:memberId", attendance_type:(.attendance | type), attendance_length:(.attendance | length? // null)}
        | select(.attendance_type == "array")
      ' "$input_file"
      ;;
    me-profile)
      jq -e -c '
        {endpoint:"/me/profile", attendance_type:(.profile.attendance | type), attendance_length:(.profile.attendance | length? // null)}
        | select(.attendance_type == "array")
      ' "$input_file"
      ;;
    me-attendance)
      jq -c '{endpoint:"/me/attendance", response_type:(type), attendance_length:(if type == "array" then length else (.items | length? // null) end)}' "$input_file"
      ;;
    *)
      printf 'runtime-smoke: unknown endpoint summary %s\n' "$endpoint" >&2
      return 2
      ;;
  esac
}
