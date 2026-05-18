#!/usr/bin/env bash
# pre-push: skill indexes drift を検出して push を拒否する。
# 対応 CI: .github/workflows/verify-indexes.yml (verify-indexes-up-to-date)
# 設計: indexes/ 配下に未反映の変更があれば、ローカルで pnpm indexes:rebuild を実行
# してコミットしてから push し直すよう促す。
set -euo pipefail

INDEXES_PATH=".claude/skills/aiworkflow-requirements/indexes"
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# 1. indexes をリビルド（副作用は indexes/ 配下のみ）
if ! pnpm indexes:rebuild >/dev/null 2>&1; then
  echo "⚠️  pnpm indexes:rebuild に失敗しました。手動で 'pnpm indexes:rebuild' を実行してください。" >&2
  exit 1
fi

# 2. rebuild 後に差分が出ていないかチェック
git add -N "$INDEXES_PATH" 2>/dev/null || true
if ! git diff --quiet -- "$INDEXES_PATH"; then
  cat <<EOF >&2
🚫 skill indexes に drift があります（CI verify-indexes-up-to-date と同等チェック）。

ローカルで以下を実行してから push し直してください:

  pnpm indexes:rebuild
  git add $INDEXES_PATH
  git commit -m "chore(indexes): rebuild skill indexes"

drift 内容:
EOF
  git diff --stat -- "$INDEXES_PATH" >&2 || true
  exit 1
fi

exit 0
