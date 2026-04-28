#!/usr/bin/env bash
# Stop Hook: Phase-12 が完了済かつ未タスク登録 / 完了移動が漏れているワークフローを検出して警告する。
# 自動実行はしない（暴走防止）。気づきだけ与える。
#
# 検出条件:
#   1. docs/30-workflows/<task>/outputs/phase-12/implementation-guide.md が存在
#   2. <task> ディレクトリが docs/30-workflows/completed-tasks/ 配下にない
#   3. かつ以下のいずれか:
#      a. outputs/phase-12/unassigned-task-detection.md に検出済み未タスクが記載されている
#      b. もしくは Phase-12 が新しく更新されてから一定時間以上 unassigned-task が増えていない

set -uo pipefail

REPO=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$REPO" || exit 0

# 5 分以内に同じチェックを実行済みならスキップ（連発抑止）
# worktree では $REPO/.git がファイルなので shared な git common dir を使う
GIT_COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null) || GIT_COMMON_DIR="$REPO/.git"
case "$GIT_COMMON_DIR" in
  /*) ;;  # 絶対パス
  *) GIT_COMMON_DIR="$REPO/$GIT_COMMON_DIR" ;;
esac
STAMP="$GIT_COMMON_DIR/.unassigned-task-last-check"
NOW=$(date +%s)
LAST=$(cat "$STAMP" 2>/dev/null || echo 0)
if [ $((NOW - LAST)) -lt 300 ]; then
  exit 0
fi

WORKFLOW_DIR="docs/30-workflows"
[ -d "$WORKFLOW_DIR" ] || exit 0

PENDING_WORKFLOWS=()

while IFS= read -r impl_guide; do
  task_dir=$(dirname "$(dirname "$(dirname "$impl_guide")")")
  case "$task_dir" in
    *"/completed-tasks/"*) continue ;;
    "$WORKFLOW_DIR/completed-tasks"*) continue ;;
  esac

  detection="$task_dir/outputs/phase-12/unassigned-task-detection.md"
  [ -f "$detection" ] || continue

  PENDING_WORKFLOWS+=("$task_dir")
done < <(find "$WORKFLOW_DIR" -mindepth 3 -maxdepth 5 -type f -path "*/outputs/phase-12/implementation-guide.md" 2>/dev/null)

echo "$NOW" > "$STAMP"

if [ ${#PENDING_WORKFLOWS[@]} -eq 0 ]; then
  exit 0
fi

# Stop Hook の stdout は次のターンに Claude のコンテキストへ system-reminder として渡される
{
  echo "[unassigned-task-check] Phase-12 完了済かつ完了移動が未実施の workflow を検出:"
  for wf in "${PENDING_WORKFLOWS[@]}"; do
    echo "  - $wf"
  done
  echo ""
  echo "推奨アクション: /ai:close-task を実行して未タスク登録 / Issue 追加 / 完了移動を完結させる。"
  echo "（PR 作成も同時に行う場合は /ai:diff-to-pr が close-task を内包しているのでそちらで OK）"
} >&2

exit 0
