#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
REPO="${OBSERVATION_REPO:-daishiman/UBM-Hyogo}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_PATH="$SCRIPT_DIR/reminder-issue-template.md"

die() {
  echo "error: $*" >&2
  exit 1
}

validate_date() {
  python3 - "$1" <<'PY'
import datetime
import sys

try:
    datetime.date.fromisoformat(sys.argv[1])
except ValueError:
    raise SystemExit(1)
PY
}

resolve_release_date() {
  if [ -n "${INPUT_RELEASE_DATE:-}" ]; then
    validate_date "$INPUT_RELEASE_DATE" || die "INPUT_RELEASE_DATE must be YYYY-MM-DD"
    echo "$INPUT_RELEASE_DATE"
    return
  fi

  local release_json published_at
  release_json="$(gh api "repos/${REPO}/releases/latest" 2>/dev/null || true)"
  published_at="$(
    RELEASE_JSON="$release_json" python3 - <<'PY'
import json
import os
import sys

try:
    payload = json.loads(os.environ.get("RELEASE_JSON", ""))
except json.JSONDecodeError:
    raise SystemExit(0)

published_at = payload.get("published_at") or ""
if published_at:
    print(published_at)
PY
  )"
  if [ -z "$published_at" ]; then
    return 0
  fi
  echo "$published_at" | cut -d'T' -f1
}

days_diff() {
  python3 - "$1" "$2" <<'PY'
import datetime
import sys

release_date = datetime.date.fromisoformat(sys.argv[1])
target_date = datetime.date.fromisoformat(sys.argv[2])
print((target_date - release_date).days)
PY
}

date_add_days() {
  python3 - "$1" "$2" <<'PY'
import datetime
import sys

release_date = datetime.date.fromisoformat(sys.argv[1])
offset_days = int(sys.argv[2])
print((release_date + datetime.timedelta(days=offset_days)).isoformat())
PY
}

today_iso() {
  echo "${TODAY_OVERRIDE:-$(date -u +%Y-%m-%d)}"
}

write_output() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf "%s=%s\n" "$1" "$2" >>"$GITHUB_OUTPUT"
  else
    printf "%s=%s\n" "$1" "$2"
  fi
}

mode_resolve_only() {
  local rel today diff offset target_date

  rel="$(resolve_release_date)"
  if [ -z "$rel" ]; then
    write_output should_remind false
    return 0
  fi
  today="$(today_iso)"
  validate_date "$today" || die "TODAY_OVERRIDE must be YYYY-MM-DD"
  diff="$(days_diff "$rel" "$today")"

  if [ -n "${INPUT_OFFSET_DAYS:-}" ]; then
    offset="$INPUT_OFFSET_DAYS"
    if [ "$offset" != "7" ] && [ "$offset" != "30" ]; then
      write_output should_remind false
      return 0
    fi
    target_date="$(date_add_days "$rel" "$offset")"
  else
    case "$diff" in
      7 | 30) offset="$diff" ;;
      *)
        write_output should_remind false
        return 0
        ;;
    esac
    target_date="$today"
  fi

  write_output should_remind true
  write_output release_date "$rel"
  write_output offset "$offset"
  write_output target_date "$target_date"
}

render_body() {
  : "${RELEASE_DATE:?}" "${OFFSET:?}" "${TARGET_DATE:?}"
  sed \
    -e "s|{{RELEASE_DATE}}|${RELEASE_DATE}|g" \
    -e "s|{{OFFSET}}|${OFFSET}|g" \
    -e "s|{{TARGET_DATE}}|${TARGET_DATE}|g" \
    "$TEMPLATE_PATH"
}

mode_create() {
  : "${RELEASE_DATE:?}" "${OFFSET:?}" "${TARGET_DATE:?}"
  local title body existing

  title="[D+${OFFSET} observation] post-release ${RELEASE_DATE}"
  existing="$(gh issue list --repo "$REPO" --state open --search "in:title \"$title\"" --json number --jq 'length')"
  if [ "$existing" -gt 0 ]; then
    echo "Reminder already exists: $title (skip)"
    return 0
  fi

  body="$(render_body)"
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "priority:medium"
}

mode_dry_run() {
  : "${RELEASE_DATE:?}" "${OFFSET:?}" "${TARGET_DATE:?}"
  echo "=== title ==="
  echo "[D+${OFFSET} observation] post-release ${RELEASE_DATE}"
  echo "=== body ==="
  render_body
}

case "$MODE" in
  --resolve-only) mode_resolve_only ;;
  --create) mode_create ;;
  --dry-run) mode_dry_run ;;
  *) die "usage: $0 --resolve-only|--create|--dry-run" ;;
esac
