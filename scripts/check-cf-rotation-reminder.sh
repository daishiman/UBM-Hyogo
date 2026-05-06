#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNBOOK_PATH="${RUNBOOK_PATH:-docs/30-workflows/operations/cf-token-rotation-runbook.md}"
LOG_PATH="${LOG_PATH:-docs/30-workflows/operations/cf-token-rotation-log.md}"
WORKFLOW_PATH="${WORKFLOW_PATH:-.github/workflows/cf-token-rotation-reminder.yml}"
THRESHOLD_DAYS="${THRESHOLD_DAYS:-85}"

date_bin() {
  if command -v gdate >/dev/null 2>&1; then
    printf '%s\n' gdate
  else
    printf '%s\n' date
  fi
}

require_file() {
  local path="$1"
  [[ -f "$ROOT/$path" ]] || { echo "::error::missing file: $path" >&2; exit 2; }
}

check_runbook_sections() {
  require_file "$RUNBOOK_PATH"
  local missing=0
  for i in 1 2 3 4 5 6 7 8 9; do
    if ! grep -qE "^## ${i}\\." "$ROOT/$RUNBOOK_PATH"; then
      echo "missing section $i"
      missing=1
    fi
  done
  [[ "$missing" -eq 0 ]]
}

check_log_fields() {
  require_file "$LOG_PATH"
  local fields=(
    "Rotation date" "Operator" "Reminder issue" "Staging new token issue time"
    "Staging smoke pass time" "Staging old token disable time" "Staging old token delete time"
    "Production approval time" "Production new token issue time" "Production smoke pass time"
    "Production old token disable time" "Production old token delete time"
    "CF_TOKEN_ISSUED_AT after rotation" "Validation summary" "Rollback used" "Related PR"
  )
  local missing=0
  for field in "${fields[@]}"; do
    if ! grep -Fq "$field" "$ROOT/$LOG_PATH"; then
      echo "missing field: $field"
      missing=1
    fi
  done
  [[ "$missing" -eq 0 ]]
}

check_yaml_links() {
  require_file "$WORKFLOW_PATH"
  require_file "$RUNBOOK_PATH"
  require_file "$LOG_PATH"
  grep -Fq "$RUNBOOK_PATH" "$ROOT/$WORKFLOW_PATH"
  grep -Fq "$LOG_PATH" "$ROOT/$WORKFLOW_PATH"
}

simulate_elapsed() {
  local issued_at="${ISSUED_AT:-}"
  [[ -n "$issued_at" ]] || { echo "::error::ISSUED_AT is required" >&2; exit 1; }
  local date_cmd
  date_cmd="$(date_bin)"
  local issued_epoch now_epoch elapsed_days due_at should_remind=false
  issued_epoch="$("$date_cmd" -u -d "$issued_at" +%s 2>/dev/null || "$date_cmd" -u -jf "%Y-%m-%d" "$issued_at" +%s)"
  now_epoch="$("$date_cmd" -u +%s)"
  elapsed_days="$(((now_epoch - issued_epoch) / 86400))"
  due_at="$("$date_cmd" -u -d "$issued_at + 90 days" +%Y-%m-%d 2>/dev/null || "$date_cmd" -u -jf "%Y-%m-%d" -v+90d "$issued_at" +%Y-%m-%d)"
  if (( elapsed_days >= THRESHOLD_DAYS )); then
    should_remind=true
  fi
  echo "issued_at=$issued_at"
  echo "elapsed_days=$elapsed_days"
  echo "due_at=$due_at"
  echo "should_remind=$should_remind"
}

check_no_secret() {
  local paths=("$RUNBOOK_PATH" "$LOG_PATH" "$WORKFLOW_PATH" "docs/30-workflows/issue-407-cf-token-rotation-90day-runbook-automation")
  ! grep -rEn 'CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{10,}|Bearer [A-Za-z0-9_.-]{20,}' "${paths[@]/#/$ROOT/}"
}

check_no_token_id() {
  local paths=("$RUNBOOK_PATH" "$LOG_PATH" "$WORKFLOW_PATH" "docs/30-workflows/issue-407-cf-token-rotation-90day-runbook-automation")
  ! grep -rEn '"id"[[:space:]]*:[[:space:]]*"[a-f0-9]{32}"|(^|[^a-f0-9])[a-f0-9]{40}([^a-f0-9]|$)' "${paths[@]/#/$ROOT/}"
}

check_no_scope_values() {
  local paths=("$RUNBOOK_PATH" "$LOG_PATH" "$WORKFLOW_PATH")
  ! grep -rEn '(^|[^A-Za-z])(Account|Zone)[[:space:]]*(>|:|\\.)[[:space:]]*[A-Za-z][A-Za-z0-9 ._-]*[[:space:]]*(>|:|\\.)[[:space:]]*(Read|Edit|Write)([^A-Za-z]|$)' "${paths[@]/#/$ROOT/}"
}

case "${1:-}" in
  --check-runbook-sections) check_runbook_sections ;;
  --check-log-fields) check_log_fields ;;
  --check-yaml-links) check_yaml_links ;;
  --simulate-elapsed) simulate_elapsed ;;
  --check-no-secret) check_no_secret ;;
  --check-no-token-id) check_no_token_id ;;
  --check-no-scope-values) check_no_scope_values ;;
  *)
    echo "usage: $0 --check-runbook-sections|--check-log-fields|--check-yaml-links|--simulate-elapsed|--check-no-secret|--check-no-token-id|--check-no-scope-values" >&2
    exit 64
    ;;
esac
