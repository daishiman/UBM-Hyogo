#!/usr/bin/env bash
# pre-commit: ブランチと無関係なファイルの混入を防ぐ
# 対象: docs/<parent>/<taskdir>/ 形式のタスクディレクトリ
# 設計正本: docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md
set -euo pipefail

BRANCH=$(git branch --show-current)

# main / dev / develop は対象外
[[ "$BRANCH" =~ ^(main|dev|develop)$ ]] && exit 0

# マージコミット中はスキップ（sync-merge では他タスク dir の混入が構造的に発生する誤検知のため）
GIT_DIR=$(git rev-parse --git-dir)
if [ -e "$GIT_DIR/MERGE_HEAD" ] || [ -e "$GIT_DIR/CHERRY_PICK_HEAD" ] || [ -e "$GIT_DIR/REVERT_HEAD" ]; then
  exit 0
fi

BRANCH_SLUG="${BRANCH##*/}"

normalize_slug() {
  printf '%s\n' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/^(task|feat|fix|chore|docs|spec|impl|implementation)-//; s/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

contains_task_tokens() {
  local branch_slug
  local task_slug
  branch_slug="$(normalize_slug "$1")"
  task_slug="$(normalize_slug "$2")"

  [ "$branch_slug" = "$task_slug" ] && return 0
  case "$branch_slug" in
    *"$task_slug"* ) return 0 ;;
  esac

  # Numeric task ID match: if task_slug starts with a numeric segment (e.g. "23-...")
  # and branch_slug contains that same numeric segment as its own token, accept.
  # This handles branches like `task-27-phase12-and-task-23-completion` that cover
  # multiple task dirs by enumerating their numeric IDs.
  local task_head_num="${task_slug%%-*}"
  if [[ "$task_head_num" =~ ^[0-9]+$ ]]; then
    case "-$branch_slug-" in
      *"-$task_head_num-"* ) return 0 ;;
    esac
  fi

  # Long task directory names often include extra context not present in the
  # branch. Require at least three meaningful token overlaps to avoid false
  # positives while still blocking unrelated task directories.
  # Exception: a single significant token (>=5 chars, e.g. `utgov`, `utgov001`) is a
  # strong identifier and sufficient on its own — common pattern for follow-up
  # tasks that share a parent task ID but otherwise diverge in slug wording.
  local matches=0
  local long_match=0
  local token
  IFS='-' read -r -a tokens <<< "$task_slug"
  for token in "${tokens[@]}"; do
    [ ${#token} -lt 4 ] && continue
    case "$branch_slug" in
      *"$token"* )
        matches=$((matches + 1))
        [ ${#token} -ge 5 ] && long_match=1
        ;;
    esac
  done

  [ "$long_match" -eq 1 ] && return 0
  [ "$matches" -ge 3 ]
}

task_dir_from_path() {
  local path="$1"
  IFS='/' read -r -a parts <<< "$path"

  [ "${parts[0]:-}" = "docs" ] || return 1
  [ -n "${parts[1]:-}" ] || return 1

  case "${parts[1]}" in
    30-workflows)
      [ -n "${parts[2]:-}" ] || return 1
      case "${parts[2]}" in
        unassigned-task|runbooks)
          # 共通領域: 単一ファイル形式の受け皿。ブランチ slug 整合は不要。
          return 1
          ;;
        completed-tasks|02-application-implementation)
          [ -n "${parts[3]:-}" ] || return 1
          printf 'docs/%s/%s/%s\n' "${parts[1]}" "${parts[2]}" "${parts[3]}"
          ;;
        *)
          # Top-level workflow files (e.g. LOGS.md) are not task dirs.
          [[ "${parts[2]}" == *.* ]] && return 1
          # `<workflow>/improvements/<sub>` の orchestration tree は <sub> 単位で
          # branch slug 整合性を判定する（子タスク branch から親 tracker を触る正当ケース）。
          if [ "${parts[3]:-}" = "improvements" ] && [ -n "${parts[4]:-}" ]; then
            printf 'docs/%s/%s/%s/%s\n' "${parts[1]}" "${parts[2]}" "${parts[3]}" "${parts[4]}"
          else
            printf 'docs/%s/%s\n' "${parts[1]}" "${parts[2]}"
          fi
          ;;
      esac
      ;;
    *)
      [ -n "${parts[2]:-}" ] || return 1
      [[ "${parts[2]}" == *.* ]] && return 1
      printf 'docs/%s/%s\n' "${parts[1]}" "${parts[2]}"
      ;;
  esac
}

# Staged file のうち「staged 内容が origin/dev と完全一致するもの」は除外する。
# 背景: sync-merge 後、自ブランチの旧コミットで触れた cross-task ファイルの stale-reference を
# 戻す revert は cross-task taint を取り除く正当な cleanup であり、誤検知の対象外。
is_revert_to_origin_dev() {
  local path="$1"
  local origin_blob
  local staged_blob
  origin_blob=$(git rev-parse --verify --quiet "origin/dev:$path" 2>/dev/null) || return 1
  staged_blob=$(git ls-files --stage -- "$path" 2>/dev/null | awk '{print $2}')
  [ -n "$staged_blob" ] || return 1
  [ "$origin_blob" = "$staged_blob" ]
}

STAGED_TASK_DIRS=$(while IFS= read -r path; do
  is_revert_to_origin_dev "$path" && continue
  task_dir_from_path "$path" || true
done < <(git diff --cached --name-only) | sort -u)

[ -z "$STAGED_TASK_DIRS" ] && exit 0

ERRORS=""
while IFS= read -r task_dir; do
  task_slug=$(basename "$task_dir")

  echo "$task_dir" | grep -qE "specs|_design|_templates|README|00-getting-started" && continue

  if ! contains_task_tokens "$BRANCH_SLUG" "$task_slug"; then
    ERRORS="${ERRORS}\n  ⚠️  $task_dir  (branch: $BRANCH)"
  fi
done <<< "$STAGED_TASK_DIRS"

if [ -n "$ERRORS" ]; then
  echo ""
  echo "🚫 [pre-commit] ブランチと無関係なタスクディレクトリが含まれています:"
  printf "%b\n" "$ERRORS"
  echo ""
  echo "  意図的に含める場合: git commit --no-verify"
  echo "  除外する場合:       git restore --staged <path>"
  echo ""
  exit 1
fi

exit 0
