#!/usr/bin/env bash
# post-merge: 遅れている worktree を通知（read-only）
# 不変条件: このスクリプトは副作用を持たない（indexes 再生成は別コマンド）
# 設計正本: docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md
set -euo pipefail

MODE="${1:-post-merge}"

REPO_ROOT="$(git rev-parse --show-toplevel)"

list_stale_worktrees() {
  local target_ref="$1"
  while IFS= read -r line; do
    WT_PATH=$(echo "$line" | awk '{print $1}')
    WT_BRANCH=$(echo "$line" | sed -n 's/.*\[\(.*\)\].*/\1/p')

    [ "$WT_PATH" = "$REPO_ROOT" ] && continue
    echo "$line" | grep -q "prunable" && continue
    echo "$line" | grep -q "detached" && continue
    [ -z "$WT_BRANCH" ] && continue
    [[ "$WT_BRANCH" =~ ^(main|master|develop|release/|hotfix/) ]] && continue

    BEHIND=$(git -C "$WT_PATH" rev-list --count "HEAD..${target_ref}" 2>/dev/null || echo "?")
    if [ "$BEHIND" != "0" ] && [ "$BEHIND" != "?" ]; then
      printf "  📁 %s (%s) — %sコミット遅れ\n" "$(basename "$WT_PATH")" "$WT_BRANCH" "$BEHIND"
    fi
  done < <(git worktree list)
}

case "$MODE" in
  post-merge)
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)
    [ "$CURRENT_BRANCH" = "main" ] || exit 0

    MAIN_HEAD=$(git log -1 --format="%h %s" main)
    STALE=$(list_stale_worktrees main)
    [ -z "$STALE" ] && exit 0

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  [post-merge] mainが更新: ${MAIN_HEAD}"
    echo "   以下のワークツリーでmain同期が必要です:"
    echo "$STALE"
    echo ""
    echo "   各ワークツリー内で実行:"
    echo "   git fetch origin main && git merge origin/main --no-edit"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ;;
  *)
    echo "[stale-worktree-notice] 未知のモード: $MODE" >&2
    exit 0
    ;;
esac

exit 0
