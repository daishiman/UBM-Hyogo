#!/usr/bin/env bash
# scripts/post-release-dashboard/30day-summary.sh
# 30 日 follow-up auto-summary 基盤エントリポイント
# Refs #517, #497, #351
#
# 使い方:
#   bash scripts/post-release-dashboard/30day-summary.sh [--dry-run]
#
# exit code:
#   0  success（gate skip / 重複 PR skip / 正常 / dry-run）
#   2  parse / aggregate error
#   3  Slack POST failure
#   64 引数不正 / 前提欠落
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
# shellcheck source=lib/aggregate.sh
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/aggregate.sh"

DRY_RUN="${DRY_RUN:-false}"
TITLE_PREFIX='[auto-summary] post-release-dashboard 30d'
TMP_DIR='tmp/30day-summary'

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --dry-run) DRY_RUN='true'; shift ;;
      -h|--help) echo "Usage: $0 [--dry-run]"; exit 0 ;;
      *) echo "error: unknown arg: $1" >&2; exit 64 ;;
    esac
  done
}

# is_30day_gate_satisfied <summary_json_path> <today_iso>
# exit 0 = 成立 / exit 1 = 不成立
is_30day_gate_satisfied() {
  local summary="$1" today="$2"
  local oldest schedule_days gap_days
  oldest=$(jq -r '.oldest_schedule_created_at' "$summary")
  schedule_days=$(jq -r '.schedule_days_total' "$summary")
  gap_days=$(jq -r '.missing_schedule_gap_days' "$summary")
  [ -n "$oldest" ] || return 1
  [ "$schedule_days" -ge 30 ] || return 1
  [ "$gap_days" -eq 0 ] || return 1
  local cutoff
  if date --version >/dev/null 2>&1; then
    cutoff=$(date -u -d "${today} -30 days" +%Y-%m-%dT%H:%M:%SZ)
  else
    cutoff=$(date -u -j -f '%Y-%m-%dT%H:%M:%SZ' -v-30d "$today" +%Y-%m-%dT%H:%M:%SZ)
  fi
  [ "$oldest" \< "$cutoff" ] || [ "$oldest" = "$cutoff" ]
}

# redact_log <file_path>
# stdout: redacted 内容（4 パターンを含む行を「(redacted: <pattern>)」へ置換）
redact_log() {
  local f="$1"
  awk '
    {
      if (match($0, /[Tt]oken=[^[:space:]]+/))         { print "(redacted: token)"; next }
      if (match($0, /[Bb]earer [^[:space:]]+/))         { print "(redacted: bearer)"; next }
      if (match($0, /[Ss]ecret:[[:space:]]*[^[:space:]]+/)) { print "(redacted: secret)"; next }
      if (match($0, /[Aa]uthorization:[[:space:]]*[^[:space:]]+/)) { print "(redacted: authorization)"; next }
      print
    }
  ' "$f"
}

# find_existing_pr <YYYYMM>
# stdout: 既存 open PR URL or 空文字
find_existing_pr() {
  local ym="$1"
  gh pr list --state open --limit 50 \
    --search "${TITLE_PREFIX} ${ym} in:title" \
    --json url --jq '.[0].url // ""'
}

# render_pr_body <summary_json_path> <YYYYMM>
render_pr_body() {
  local s="$1" ym="$2"
  local fr; fr=$(jq -r '.failure_rate' "$s")
  cat <<EOF
# post-release-dashboard 30d auto-summary (${ym})

Refs #517, Refs #497, Refs #351

## 集計結果

- runs_total: $(jq -r '.runs_total' "$s")
- schedule_runs_total: $(jq -r '.schedule_runs_total' "$s")
- schedule_days_total: $(jq -r '.schedule_days_total' "$s")
- missing_schedule_gap_days: $(jq -r '.missing_schedule_gap_days' "$s")
- oldest_schedule_created_at: $(jq -r '.oldest_schedule_created_at' "$s")
- conclusion 分布: $(jq -c '.conclusion_dist' "$s")
- longest_failure_streak: $(jq -r '.longest_failure_streak' "$s")
- failure_rate: ${fr}

## 原因分類

- failure_cause_dist: $(jq -c '.failure_cause_dist' "$s")
- failure_run_urls: $(jq -c '.failure_run_urls' "$s")

workflow_failure_unclassified は GitHub Actions の run list から機械判定できる最小分類です。詳細原因は draft PR レビューで run URL を確認して追記します。

EOF
  if awk -v fr="$fr" 'BEGIN{ exit !(fr+0 >= 0.10) }'; then
    cat <<'EOF'
## retry/alert 追加検討

failure_rate が 10% 以上です。retry / alert 実装を別 issue で検討してください。

EOF
  fi
  return 0
}

# render_slack_payload <summary_json_path> <pr_url>
# stdout: 5 行以内の JSON {"text":"..."}
render_slack_payload() {
  local s="$1" url="$2"
  local txt
  txt=$(printf '%s\n' \
    "post-release-dashboard 30d auto-summary" \
    "runs=$(jq -r '.runs_total' "$s") schedule=$(jq -r '.schedule_runs_total' "$s")" \
    "failure_rate=$(jq -r '.failure_rate' "$s") longest_streak=$(jq -r '.longest_failure_streak' "$s")" \
    "draft PR: ${url}" \
    "Refs #517, #497, #351"
  )
  jq -n --arg t "$txt" '{text:$t}'
}

# post_slack <payload_json>
post_slack() {
  local payload="$1"
  if [ "$DRY_RUN" = "true" ]; then
    echo "[dry-run] would post to slack"
    return 0
  fi
  if [ -z "${SLACK_WEBHOOK_URL:-}" ]; then
    echo "error: SLACK_WEBHOOK_URL is not set" >&2
    return 3
  fi
  curl -sS -f -X POST -H 'Content-Type: application/json' \
    --data "$payload" "$SLACK_WEBHOOK_URL" >/dev/null || return 3
}

main() {
  parse_args "$@"

  if [ ! -f .github/workflows/post-release-dashboard.yml ]; then
    echo "error: parent workflow .github/workflows/post-release-dashboard.yml not found" >&2
    exit 64
  fi

  mkdir -p "$TMP_DIR"
  local runs="$TMP_DIR/runs.json"
  local summary="$TMP_DIR/summary.json"
  local redacted="$TMP_DIR/summary.redacted.json"

  if ! gh run list --workflow=post-release-dashboard.yml --limit=80 \
        --json conclusion,createdAt,event,databaseId,url > "$runs"; then
    echo "error: gh run list failed" >&2
    exit 2
  fi

  if ! aggregate_runs "$runs" > "$summary"; then
    echo "error: aggregate_runs failed" >&2
    exit 2
  fi

  local today
  today=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  if ! is_30day_gate_satisfied "$summary" "$today"; then
    echo "skipped: 30-day gate not satisfied (oldest=$(jq -r '.oldest_schedule_created_at' "$summary") schedule_days=$(jq -r '.schedule_days_total' "$summary") missing_gap_days=$(jq -r '.missing_schedule_gap_days' "$summary"))"
    exit 0
  fi

  local ym; ym=$(date -u +%Y%m)
  local existing; existing=$(find_existing_pr "$ym")
  if [ -n "$existing" ]; then
    echo "skipped: existing PR found ($existing)"
    exit 0
  fi

  redact_log "$summary" > "$redacted"
  local pr_body; pr_body=$(render_pr_body "$redacted" "$ym")

  if [ "$DRY_RUN" = "true" ]; then
    echo "----- PR_BODY -----"
    printf '%s\n' "$pr_body"
    echo "----- SLACK_PAYLOAD -----"
    render_slack_payload "$redacted" "https://example.invalid/dry-run"
    echo "[dry-run] no side effects"
    exit 0
  fi

  local branch="auto/post-release-30day-summary-${ym}"
  git checkout -b "$branch"
  mkdir -p .claude/skills/aiworkflow-requirements/changelog
  printf '%s\n' "$pr_body" > ".claude/skills/aiworkflow-requirements/changelog/${ym}-30day-auto-summary.md"
  git add ".claude/skills/aiworkflow-requirements/changelog/${ym}-30day-auto-summary.md"
  git commit -m "chore(skill): post-release-dashboard 30d auto-summary ${ym}"
  git push -u origin "$branch"

  local pr_url
  pr_url=$(gh pr create --draft --base main \
    --title "${TITLE_PREFIX} ${ym}" \
    --body "$pr_body")

  local payload; payload=$(render_slack_payload "$redacted" "$pr_url")
  post_slack "$payload"
}

# テスト時に source されると main を起動しない
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  main "$@"
fi
