#!/usr/bin/env bash
# pre-commit: lefthook.yml 直編集 ack ゲート + 手書き .git/hooks 検知ガード（issue-230）
# 正本: lefthook.yml / docs/00-getting-started-manual/lefthook-operations.md
# 方針: CLAUDE.md「Git hook の方針」
#
# 責務:
#   R-2/R-3  staged 対象に lefthook.yml が含まれ、LEFTHOOK_EDIT_ACK=1 が無ければ block
#   R-1/R-4  .git/hooks/ 配下の手書きファイル（*.sample・lefthook 注入署名を除く）を block
# 副作用なし（read-only）。merge/rebase/cherry-pick/revert 中は skip（AC-4）。
set -euo pipefail

# --- メッセージ（AC-3: ack 方法 + CLAUDE.md 方針 + lefthook-operations.md を必ず含む） ---
print_lefthook_edit_block() {
  echo "" >&2
  echo "🚫 [pre-commit] lefthook.yml の直編集を検知しました（issue-230 lefthook-edit-guard）。" >&2
  echo "" >&2
  echo "  lefthook.yml は Git hook の唯一の正本です。意図的に編集する場合は明示 ack で通過してください:" >&2
  echo "    LEFTHOOK_EDIT_ACK=1 git commit ..." >&2
  echo "" >&2
  echo "  方針: CLAUDE.md「Git hook の方針」" >&2
  echo "  詳細: docs/00-getting-started-manual/lefthook-operations.md" >&2
  echo "" >&2
}

print_handwritten_hook_block() {
  local offenders="$1"
  echo "" >&2
  echo "🚫 [pre-commit] 手書きの .git/hooks ファイルを検知しました（issue-230 lefthook-edit-guard）。" >&2
  echo "" >&2
  echo "  .git/hooks/* の手書きは禁止です。hook は lefthook.yml を正本として lefthook install が配置します。" >&2
  echo "  対象ファイル:" >&2
  printf '%b' "$offenders" | while IFS= read -r f; do
    [ -n "$f" ] && echo "    - $f" >&2
  done
  echo "" >&2
  echo "  対処: 当該ファイルを削除し、必要な hook は lefthook.yml に定義してください:" >&2
  echo "    rm <path> && mise exec -- pnpm install   # lefthook install が再配置" >&2
  echo "" >&2
  echo "  方針: CLAUDE.md「Git hook の方針」" >&2
  echo "  詳細: docs/00-getting-started-manual/lefthook-operations.md" >&2
  echo "" >&2
}

# --- 0. sync-merge 等は skip（AC-4: false positive 抑制） ---
#   marker は per-worktree の git-dir に置かれるため --git-dir を使う。
git_dir="$(git rev-parse --git-dir)"
for marker in MERGE_HEAD REBASE_HEAD CHERRY_PICK_HEAD REVERT_HEAD; do
  [ -e "$git_dir/$marker" ] && exit 0
done

# --- 1. lefthook.yml 直編集 ack ゲート（R-2 / R-3） ---
staged_lefthook="$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^lefthook\.yml$' || true)"
if [ -n "$staged_lefthook" ] && [ "${LEFTHOOK_EDIT_ACK:-}" != "1" ]; then
  print_lefthook_edit_block
  exit 1
fi

# --- 2. 手書き .git/hooks 検知（R-1 local / R-4） ---
#   hooks は共有 commondir 配下にあるため --git-common-dir を使う（worktree 差異吸収）。
hooks_dir="$(git rev-parse --git-common-dir)/hooks"
offenders=""
if [ -d "$hooks_dir" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    # git が実行する hook 名は拡張子を持たない。ドットを含むファイル名
    # （.sample / .old / .bak 等）は git が無視するため offender にしない（AC-4）。
    case "$(basename "$f")" in *.*) continue;; esac
    # lefthook 注入署名を含む managed hook は除外（AC-4）
    grep -qiE 'LEFTHOOK|lefthook' "$f" 2>/dev/null && continue
    offenders="${offenders}${f}\n"
  done < <(find "$hooks_dir" -maxdepth 1 -type f)
fi
if [ -n "$offenders" ]; then
  print_handwritten_hook_block "$offenders"
  exit 1
fi

exit 0
