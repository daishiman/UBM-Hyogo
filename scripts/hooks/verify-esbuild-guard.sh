#!/usr/bin/env bash
# verify-esbuild-guard.sh — pre-push 用 esbuild/arch/isolation 検証ラッパー
#
# sync-merge スキップ判定（個人開発運用ポリシー）:
#   push 範囲 (merge-base HEAD origin/dev ..HEAD) に merge commit が含まれる場合、
#   sync-merge による偶発的な hook 失敗 (例: terminal が Rosetta 環境で起動されており
#   arm64 native Node が選択されない等の環境差) を許容して skip する。
#   coverage-guard と同じ pattern。
#
# Exit code:
#   0 = PASS / SKIP
#   1 = FAIL

set -u
set -o pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

log() { printf '[verify-esbuild-guard] %s\n' "$*" >&2; }

base=""
if base=$(git -C "$ROOT_DIR" merge-base HEAD origin/dev 2>/dev/null) && [ -n "$base" ]; then
  range="${base}..HEAD"
  merge_count=$(git -C "$ROOT_DIR" log --merges --format=%H "$range" 2>/dev/null | wc -l | tr -d ' ')
  if [ "${merge_count:-0}" -ge 1 ]; then
    log "SKIP: push 範囲 ($range) に merge commit が ${merge_count} 件含まれます。sync-merge のため verify-esbuild をスキップします。"
    exit 0
  fi
fi

# mise 管理 node を明示利用（Volta / nvm の shim が PATH 先頭にあっても
# arm64 native node が選ばれるようにする。Refs: issue #747 §4）
if command -v mise >/dev/null 2>&1; then
  NODE_BIN=(mise exec -- node)
else
  NODE_BIN=(node)
fi

"${NODE_BIN[@]}" "$ROOT_DIR/scripts/verify-node-arch.mjs" && \
  "${NODE_BIN[@]}" "$ROOT_DIR/scripts/verify-worktree-node-modules-isolation.mjs" && \
  "${NODE_BIN[@]}" "$ROOT_DIR/scripts/verify-esbuild-version.mjs"
