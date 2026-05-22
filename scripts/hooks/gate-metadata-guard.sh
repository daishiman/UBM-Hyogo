#!/usr/bin/env bash
# pre-push: 変更された artifacts.json に metadata.gates が欠落していれば push を拒否。
# 対応 CI: .github/workflows/verify-gate-metadata.yml (validate)
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# upstream が無い場合（新規 branch の初回 push）は origin/dev を base にする
if UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null); then
  BASE="$UPSTREAM"
else
  BASE="origin/dev"
fi

# sync-merge ノイズ除去（CLAUDE.md 個人開発運用ポリシーに準拠）:
#   push 範囲に merge commit が含まれる場合、sync-merge で他タスクの artifacts.json が大量に
#   引き込まれる。これらを評価対象にすると誤判定するため `--no-merges` で feature 由来の
#   non-merge commit のみを対象とする。feature 単体 push は全変更を対象にする（従来通り）。
MERGE_COUNT=$(git log --merges --format=%H "$BASE..HEAD" 2>/dev/null | wc -l | tr -d ' ')
if [ "${MERGE_COUNT:-0}" -ge 1 ]; then
  # merge commit を除外し、feature ブランチ固有の commit が触った artifacts.json のみ抽出
  CHANGED=$(git log --no-merges --name-only --format= "$BASE..HEAD" -- '**/artifacts.json' 2>/dev/null | sort -u | sed '/^$/d' || true)
  echo "[gate-metadata-guard] merge commit を ${MERGE_COUNT} 件検出。non-merge commit 由来の artifacts.json のみ検証します。" >&2
else
  CHANGED=$(git diff --name-only "$BASE...HEAD" -- '**/artifacts.json' 2>/dev/null || true)
fi

if [ -z "$CHANGED" ]; then
  exit 0
fi

# shellcheck disable=SC2086
if ! pnpm gate-metadata:validate --require-gates-for-changed $CHANGED 2>&1 | tail -5 | grep -q 'ERROR: 0'; then
  cat <<EOF >&2
🚫 artifacts.json に metadata.gates が欠落しています（CI verify-gate-metadata と同等チェック）。

該当ファイルに metadata.gates 配列を追加してから push し直してください。
参照例: docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/artifacts.json

検証コマンド:
  pnpm gate-metadata:validate --require-gates-for-changed <path-to-artifacts.json>
EOF
  exit 1
fi

exit 0
