#!/usr/bin/env bash
# Failure 時 Slack incident webhook に redact 済み summary を post する helper.
#
# Usage:
#   ci-summary-post.sh <evidence-dir> [--dry-run]
#
# Args:
#   evidence-dir : summary.json があるディレクトリ
#   --dry-run    : Slack post せず stdout に redact 済み message を出力
#
# Required env:
#   SLACK_WEBHOOK_INCIDENT : 1Password / GitHub Secret 経由（未設定なら dry-run 同等）
#
# Exit:
#   0 : post 成功（dry-run 含む）
#   1 : summary.json 不在 / 解析失敗
#   2 : Slack post HTTP 4xx/5xx
set -euo pipefail

EVIDENCE_DIR="${1:-}"
DRY_RUN=0
shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$EVIDENCE_DIR" ]]; then
  echo "evidence dir required" >&2
  exit 1
fi

SUMMARY_FILE="$EVIDENCE_DIR/summary.json"
if [[ ! -f "$SUMMARY_FILE" ]]; then
  echo "summary.json not found at $SUMMARY_FILE" >&2
  exit 1
fi

if ! jq -e . "$SUMMARY_FILE" >/dev/null 2>&1; then
  echo "summary.json is not valid JSON" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REDACT="$SCRIPT_DIR/redact.sh"

# summary を 1 行 message に整形して redact 経由で出力する
MESSAGE="$(
  jq -r '
    "runtime-smoke FAIL status=\(.status) routes=" +
    ([.routes[] | "\(.label):\(.status)/\(.http // "n/a")"] | join(","))
  ' "$SUMMARY_FILE" | bash "$REDACT"
)"

if [[ "$DRY_RUN" -eq 1 || -z "${SLACK_WEBHOOK_INCIDENT:-}" ]]; then
  echo "$MESSAGE"
  exit 0
fi

PAYLOAD="$(jq -nc --arg text "$MESSAGE" '{text: $text}')"
HTTP_STATUS="$(
  curl -sS -o /tmp/ci-summary-post.body \
    -w "%{http_code}" \
    -X POST \
    -H 'Content-Type: application/json' \
    --data "$PAYLOAD" \
    "$SLACK_WEBHOOK_INCIDENT" || echo "000"
)"

if [[ ! "$HTTP_STATUS" =~ ^2 ]]; then
  echo "Slack post failed: http=$HTTP_STATUS" >&2
  exit 2
fi

echo "$MESSAGE"
