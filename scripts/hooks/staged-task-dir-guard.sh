#!/usr/bin/env bash
# pre-commit: ブランチと無関係なファイルの混入を防ぐ
# 対象: docs/<parent>/<taskdir>/ 形式のタスクディレクトリ
# 設計正本: docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md
set -euo pipefail

BRANCH=$(git branch --show-current)

# main / dev / develop は対象外
[[ "$BRANCH" =~ ^(main|dev|develop)$ ]] && exit 0

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

  # Long task directory names often include extra context not present in the
  # branch. Require at least three meaningful token overlaps to avoid false
  # positives while still blocking unrelated task directories.
  local matches=0
  local token
  IFS='-' read -r -a tokens <<< "$task_slug"
  for token in "${tokens[@]}"; do
    [ ${#token} -lt 4 ] && continue
    case "$branch_slug" in
      *"$token"* ) matches=$((matches + 1)) ;;
    esac
  done

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
        completed-tasks|unassigned-task)
          [ -n "${parts[3]:-}" ] || return 1
          printf 'docs/%s/%s/%s\n' "${parts[1]}" "${parts[2]}" "${parts[3]}"
          ;;
        *)
          printf 'docs/%s/%s\n' "${parts[1]}" "${parts[2]}"
          ;;
      esac
      ;;
    *)
      [ -n "${parts[2]:-}" ] || return 1
      printf 'docs/%s/%s\n' "${parts[1]}" "${parts[2]}"
      ;;
  esac
}

STAGED_TASK_DIRS=$(while IFS= read -r path; do
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
