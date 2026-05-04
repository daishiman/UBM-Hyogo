#!/usr/bin/env bash
# stale-worktree-notice: 遅れている worktree / ローカルブランチを通知（read-only）
# 不変条件: このスクリプトは副作用を持たない（indexes 再生成は別コマンド）
# 設計正本: docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md
#
# 対応モード:
#   post-merge   現在ブランチが main / dev のとき、その更新を他 worktree に通知
#   fetch        origin/main / origin/dev とローカル main / dev の遅れを通知（手動 / `pnpm sync:check`）
#
# git には post-fetch hook が無いため、fetch モードは pnpm sync:check 経由で手動実行する。
set -euo pipefail

MODE="${1:-post-merge}"

REPO_ROOT="$(git rev-parse --show-toplevel)"

# 監視対象の長期ブランチ（ローカルに存在するものだけを対象にする）
TRACKED_BRANCHES=(main dev)

list_stale_worktrees() {
  local target_ref="$1"
  while IFS= read -r line; do
    WT_PATH=$(echo "$line" | awk '{print $1}')
    WT_BRANCH=$(echo "$line" | sed -n 's/.*\[\(.*\)\].*/\1/p')

    [ "$WT_PATH" = "$REPO_ROOT" ] && continue
    echo "$line" | grep -q "prunable" && continue
    echo "$line" | grep -q "detached" && continue
    [ -z "$WT_BRANCH" ] && continue
    [[ "$WT_BRANCH" =~ ^(main|master|dev|develop|release/|hotfix/) ]] && continue

    BEHIND=$(git -C "$WT_PATH" rev-list --count "HEAD..${target_ref}" 2>/dev/null || echo "?")
    if [ "$BEHIND" != "0" ] && [ "$BEHIND" != "?" ]; then
      printf "  📁 %s (%s) — %sコミット遅れ (vs %s)\n" \
        "$(basename "$WT_PATH")" "$WT_BRANCH" "$BEHIND" "$target_ref"
    fi
  done < <(git worktree list)
}

branch_exists_local() {
  git show-ref --verify --quiet "refs/heads/$1"
}

branch_exists_remote() {
  git show-ref --verify --quiet "refs/remotes/origin/$1"
}

case "$MODE" in
  post-merge)
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)
    case "$CURRENT_BRANCH" in
      main|dev) ;;
      *) exit 0 ;;
    esac

    HEAD_INFO=$(git log -1 --format="%h %s" "$CURRENT_BRANCH")
    STALE=$(list_stale_worktrees "$CURRENT_BRANCH")
    [ -z "$STALE" ] && exit 0

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  [post-merge] ${CURRENT_BRANCH} が更新: ${HEAD_INFO}"
    echo "   以下のワークツリーで ${CURRENT_BRANCH} 同期が必要です:"
    echo "$STALE"
    echo ""
    echo "   各ワークツリー内で実行:"
    echo "   git fetch origin ${CURRENT_BRANCH} && git merge origin/${CURRENT_BRANCH} --no-edit"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ;;

  fetch)
    # main / dev のローカルが origin より遅れていれば通知し、関連 worktree も列挙する。
    # exit code は常に 0（read-only 通知）。
    REPORTED=0
    for BR in "${TRACKED_BRANCHES[@]}"; do
      branch_exists_remote "$BR" || continue

      if branch_exists_local "$BR"; then
        AHEAD=$(git rev-list --count "${BR}..origin/${BR}" 2>/dev/null || echo "0")
      else
        AHEAD="?"
      fi

      STALE_WT=$(list_stale_worktrees "origin/${BR}")

      if [ "$AHEAD" != "0" ] || [ -n "$STALE_WT" ]; then
        if [ "$REPORTED" = "0" ]; then
          echo ""
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          echo "🔄 [sync:check] リモート同期状況"
          REPORTED=1
        fi
        REMOTE_HEAD=$(git log -1 --format="%h %s" "origin/${BR}" 2>/dev/null || echo "n/a")
        if [ "$AHEAD" = "?" ]; then
          echo "   • ローカル ${BR} が未作成 — 最新: ${REMOTE_HEAD}"
          echo "       作成: git checkout -b ${BR} origin/${BR}"
        elif [ "$AHEAD" != "0" ]; then
          echo "   • ${BR}: origin が ${AHEAD} コミット先行 — 最新: ${REMOTE_HEAD}"
          echo "       同期: git checkout ${BR} && git merge --ff-only origin/${BR}"
        else
          echo "   • ${BR}: ローカルは最新"
        fi
        if [ -n "$STALE_WT" ]; then
          echo "     遅れているワークツリー:"
          echo "$STALE_WT" | sed 's/^/    /'
        fi
      fi
    done

    if [ "$REPORTED" = "1" ]; then
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
      echo "✅ [sync:check] main / dev ともリモートと同期済み・遅れている worktree はありません"
    fi
    ;;

  *)
    echo "[stale-worktree-notice] 未知のモード: $MODE" >&2
    echo "  使用可能: post-merge | fetch" >&2
    exit 0
    ;;
esac

exit 0
