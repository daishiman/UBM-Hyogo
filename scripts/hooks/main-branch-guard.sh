#!/usr/bin/env bash
# main / dev ブランチへの直接コミットを禁止する。
# prepare-commit-msg でも実行し、git commit --no-verify による迂回を防ぐ。
# 解除する場合: ALLOW_DIRECT_COMMIT=1 git commit ...
set -euo pipefail

if [[ "${ALLOW_DIRECT_COMMIT:-0}" == "1" ]]; then
  exit 0
fi

current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"

case "$current_branch" in
  main|dev)
    cat >&2 <<EOF
🚫 '$current_branch' ブランチへの直接コミットは禁止されています。

ブランチ戦略: feature/* --PR--> dev --PR--> main

対処:
  1) 別ブランチに切り替え:    git switch -c feat/<name>
  2) ワークツリーで作業:      bash scripts/new-worktree.sh feat/<name>
  3) どうしても必要な場合:    ALLOW_DIRECT_COMMIT=1 git commit ...
EOF
    exit 1
    ;;
esac

exit 0
