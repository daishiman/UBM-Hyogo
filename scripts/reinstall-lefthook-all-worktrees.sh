#!/usr/bin/env bash
# Reinstall lefthook hooks across every local git worktree.
set -uo pipefail

DRY_RUN=0
SHOW_HELP=0

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    -h|--help)
      SHOW_HELP=1
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Use --help for usage." >&2
      exit 2
      ;;
  esac
done

if [[ "$SHOW_HELP" -eq 1 ]]; then
  cat <<'EOF'
Usage: bash scripts/reinstall-lefthook-all-worktrees.sh [--dry-run]

Walks git worktree list --porcelain and runs lefthook install in each worktree
that has node_modules available. Missing node_modules is reported as SKIP.
EOF
  exit 0
fi

if ! command -v git >/dev/null 2>&1; then
  echo "FAIL git command is not available" >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "FAIL this script must run inside a git worktree" >&2
  exit 1
fi

run_pnpm_lefthook() {
  if command -v mise >/dev/null 2>&1; then
    mise exec -- pnpm exec lefthook "$@"
  else
    pnpm exec lefthook "$@"
  fi
}

pass_count=0
skip_count=0
fail_count=0
total_count=0
declare -a failures=()

echo "lefthook worktree reinstall"
echo "dry_run=$DRY_RUN"
echo ""

while IFS= read -r worktree_path; do
  [[ -n "$worktree_path" ]] || continue
  total_count=$((total_count + 1))

  if [[ ! -d "$worktree_path" ]]; then
    echo "SKIP $worktree_path :: path does not exist"
    skip_count=$((skip_count + 1))
    continue
  fi

  if [[ ! -d "$worktree_path/node_modules" ]]; then
    echo "SKIP $worktree_path :: node_modules not found"
    skip_count=$((skip_count + 1))
    continue
  fi

  if [[ ! -f "$worktree_path/lefthook.yml" ]]; then
    echo "SKIP $worktree_path :: lefthook.yml not found"
    skip_count=$((skip_count + 1))
    continue
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "PASS $worktree_path :: dry-run target"
    pass_count=$((pass_count + 1))
    continue
  fi

  if (
    cd "$worktree_path" &&
      run_pnpm_lefthook install &&
      run_pnpm_lefthook version >/dev/null
  ); then
    echo "PASS $worktree_path :: lefthook install + version"
    pass_count=$((pass_count + 1))
  else
    echo "FAIL $worktree_path :: lefthook install or version failed"
    failures+=("$worktree_path")
    fail_count=$((fail_count + 1))
  fi
done < <(git worktree list --porcelain | awk '/^worktree /{sub(/^worktree /, ""); print}')

echo ""
echo "summary total=$total_count pass=$pass_count skip=$skip_count fail=$fail_count"

if [[ "$fail_count" -gt 0 ]]; then
  echo ""
  echo "failed worktrees:"
  printf ' - %s\n' "${failures[@]}"
  exit 1
fi

exit 0
