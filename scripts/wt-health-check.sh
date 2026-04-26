#!/usr/bin/env bash
# WT健全性チェック: マージ済みゾンビWT・origin/main遅れWTを検出して通知
# 使い方: wt-health-check.sh [--silent]
#   --silent: 問題がない場合は何も出力しない（PreToolUse hook用）

SILENT=0
[[ "${1:-}" == "--silent" ]] && SILENT=1

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

ZOMBIE_WTS=""
STALE_WTS=""

while IFS= read -r line; do
  WT_PATH=$(echo "$line" | awk '{print $1}')
  WT_BRANCH=$(echo "$line" | sed -n 's/.*\[\(.*\)\].*/\1/p')

  # メインリポジトリルートはスキップ
  [ "$WT_PATH" = "$REPO_ROOT" ] && continue
  # prunable/detachedはスキップ
  echo "$line" | grep -qE "prunable|detached" && continue
  [ -z "$WT_BRANCH" ] && continue
  # mainブランチ系はスキップ
  [[ "$WT_BRANCH" =~ ^(main|master|develop|dev|release/|hotfix/) ]] && continue

  WT_NAME=$(basename "$WT_PATH")

  # origin/mainにマージ済みか確認（ゾンビWT検出）
  if git branch -r --merged origin/main 2>/dev/null | grep -qF "origin/${WT_BRANCH}"; then
    ZOMBIE_WTS="${ZOMBIE_WTS}\n  🧟 ${WT_NAME} [${WT_BRANCH}] → mainにマージ済み、削除推奨"
    continue
  fi

  # origin/mainより何コミット遅れているか
  BEHIND=$(git -C "$WT_PATH" rev-list HEAD..origin/main --count 2>/dev/null || echo "?")
  if [ "$BEHIND" != "0" ] && [ "$BEHIND" != "?" ] && [ "$BEHIND" -gt 0 ]; then
    STALE_WTS="${STALE_WTS}\n  ⏰ ${WT_NAME} [${WT_BRANCH}] → origin/mainより${BEHIND}コミット遅れ"
  fi
done < <(git worktree list)

# 問題がなければ終了
if [ -z "$ZOMBIE_WTS" ] && [ -z "$STALE_WTS" ]; then
  [ "$SILENT" -eq 0 ] && echo "✅ [wt-health] 全ワークツリーは健全です"
  exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  [wt-health] ワークツリー健全性チェック"

if [ -n "$ZOMBIE_WTS" ]; then
  echo ""
  echo "  【ゾンビWT】ブランチがmainにマージ済みのワークツリー:"
  printf "%b\n" "$ZOMBIE_WTS"
  echo ""
  echo "  削除コマンド例:"
  echo "  git worktree remove .worktrees/<name> --force"
  echo "  git branch -d <branch>"
fi

if [ -n "$STALE_WTS" ]; then
  echo ""
  echo "  【遅れWT】origin/mainに追従が必要なワークツリー:"
  printf "%b\n" "$STALE_WTS"
  echo ""
  echo "  同期コマンド例:"
  echo "  git -C .worktrees/<name> merge origin/main --no-edit"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
