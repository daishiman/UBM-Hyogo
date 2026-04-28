#!/usr/bin/env bash
# Cloudflare wrangler ラッパー
# - シークレットは 1Password CLI 経由 (`scripts/with-env.sh` → `op run --env-file=.env`) で動的注入
# - `.env` には実値を絶対に書かない (AI 学習混入防止) — op:// 参照のみ可
# - ローカル node_modules/.bin/wrangler を優先使用 (グローバル wrangler は esbuild 不整合の元)
# - グローバル/サブパッケージ esbuild とのバージョン不整合を ESBUILD_BINARY_PATH で自動解決
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <wrangler-args...>" >&2
  echo "  e.g. $0 whoami" >&2
  echo "       $0 d1 list" >&2
  echo "       $0 deploy --config apps/api/wrangler.toml --env production" >&2
  exit 64
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"

if ! command -v mise >/dev/null 2>&1; then
  echo "[cf.sh] mise が見つかりません" >&2
  exit 1
fi
if ! command -v op >/dev/null 2>&1; then
  echo "[cf.sh] 1Password CLI (op) が見つかりません" >&2
  exit 1
fi

# esbuild バイナリパスを wrangler 同梱版に固定
# bash が Rosetta 経由で起動されている場合 uname -m は不正確になるため、node_modules に存在するものを採用
ESBUILD_PARENT="$REPO_ROOT/node_modules/wrangler/node_modules/@esbuild"
for p in darwin-arm64 darwin-x64 linux-x64 linux-arm64; do
  candidate="$ESBUILD_PARENT/$p/bin/esbuild"
  if [ -f "$candidate" ]; then
    export ESBUILD_BINARY_PATH="$candidate"
    break
  fi
done

if [ "${CF_SH_DEBUG:-}" = "1" ]; then
  echo "[cf.sh debug] REPO_ROOT=$REPO_ROOT" >&2
  echo "[cf.sh debug] ESBUILD_BINARY_PATH=${ESBUILD_BINARY_PATH:-<unset>}" >&2
fi

# ローカル wrangler を優先 (グローバルは依存解決が外側に漏れて不安定)
LOCAL_WRANGLER="$REPO_ROOT/node_modules/.bin/wrangler"
if [ -x "$LOCAL_WRANGLER" ]; then
  WRANGLER_BIN="$LOCAL_WRANGLER"
else
  WRANGLER_BIN="wrangler"
fi

# with-env.sh が op run で .env (op:// 参照のみ) を解決して env に注入する
# ESBUILD_BINARY_PATH は親 export 済みなので op run 経由でも子に継承される
exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- "$WRANGLER_BIN" "$@"
