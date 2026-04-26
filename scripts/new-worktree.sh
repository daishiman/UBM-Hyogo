#!/usr/bin/env bash
# 新規ワークツリー作成 + 環境セットアップスクリプト
# 使い方: bash scripts/new-worktree.sh <ブランチ名>
# 例:     bash scripts/new-worktree.sh feat/my-feature
set -euo pipefail

BRANCH="${1:?ブランチ名を指定してください (例: feat/my-feature)}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
WT_NAME="task-${TIMESTAMP}-wt"
WT_PATH="${REPO_ROOT}/.worktrees/${WT_NAME}"

echo "=== ワークツリー作成 ==="
echo "ブランチ: $BRANCH"
echo "パス    : $WT_PATH"

# リモートmainを最新化
git fetch origin main

# ワークツリー作成（mainから分岐）
git worktree add -b "$BRANCH" "$WT_PATH" origin/main

echo ""
echo "=== pnpm install ==="
cd "$WT_PATH"

# mise が使える場合は mise exec 経由で実行（Node 24 を確実に使う）
if command -v mise &>/dev/null; then
  mise trust --quiet 2>/dev/null || true
  mise install --quiet
  mise exec -- pnpm install
else
  pnpm install
fi

echo ""
echo "======================================================"
echo "✅ ワークツリー作成完了"
echo "======================================================"
echo ""
echo "  ブランチ: $BRANCH"
echo "  パス    : $WT_PATH"
echo ""
echo "⚠️  重要: Claude Code は必ずワークツリー内から起動してください"
echo "   メインディレクトリから起動するとファイルが混入します"
echo ""
echo "  【新しいターミナルタブで実行】"
echo "  cd $WT_PATH && claude"
echo ""
echo "  【または以下をコピーして実行】"
echo "  cd $WT_PATH"
echo "======================================================"
