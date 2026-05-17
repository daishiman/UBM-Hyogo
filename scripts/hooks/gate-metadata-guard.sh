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

# sync-merge スキップ判定（CLAUDE.md 個人開発運用ポリシーに準拠）:
#   push 範囲に merge commit を 1 件以上含む場合、sync-merge で他タスクの artifacts.json が
#   大量に混入し、`--require-gates-for-changed` の評価対象を肥大化させて誤判定を起こすため
#   このガードをスキップする。feature 単体 push は従来通りチェック対象。
MERGE_COUNT=$(git log --merges --format=%H "$BASE..HEAD" 2>/dev/null | wc -l | tr -d ' ')
if [ "${MERGE_COUNT:-0}" -ge 1 ]; then
  echo "[gate-metadata-guard] SKIP: push 範囲 ($BASE..HEAD) に merge commit が ${MERGE_COUNT} 件含まれます。sync-merge のためスキップします。" >&2
  exit 0
fi

# push 範囲で変更された artifacts.json のみを対象（macOS bash 3.2 互換のため mapfile 不使用）
CHANGED=$(git diff --name-only "$BASE...HEAD" -- '**/artifacts.json' 2>/dev/null || true)

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
