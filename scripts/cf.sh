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
  echo "       $0 observability-diff --current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web" >&2
  exit 64
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  export CF_SH_SKIP_WITH_ENV=1
fi

if [ "${CF_SH_SKIP_WITH_ENV:-0}" != "1" ]; then
  if ! command -v mise >/dev/null 2>&1; then
    echo "[cf.sh] mise が見つかりません" >&2
    exit 1
  fi
  if ! command -v op >/dev/null 2>&1; then
    echo "[cf.sh] 1Password CLI (op) が見つかりません" >&2
    exit 1
  fi
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

if [ "$1" = "observability-diff" ]; then
  shift
  exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- bash "$REPO_ROOT/scripts/observability-target-diff.sh" "$@"
fi

if [ "$1" = "api-get" ]; then
  shift
  if [ "$#" -ne 1 ]; then
    echo "usage: $0 api-get /client/v4/..." >&2
    exit 64
  fi
  api_path="$1"
  case "$api_path" in
    /client/v4/*) ;;
    *) echo "[cf.sh] api-get only allows /client/v4/... paths" >&2; exit 64 ;;
  esac
  if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
    exec bash -c '
      set -euo pipefail
      curl -fsS \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}" \
        -H "Content-Type: application/json" \
        "https://api.cloudflare.com$1"
    ' _ "$api_path"
  fi
  exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- bash -c '
    set -euo pipefail
    curl -fsS \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}" \
      -H "Content-Type: application/json" \
      "https://api.cloudflare.com$1"
  ' _ "$api_path"
fi

if [ "$1" = "api-post" ]; then
  shift
  if [ "$#" -lt 1 ]; then
    echo "usage: $0 api-post /client/v4/graphql [-d JSON]" >&2
    exit 64
  fi
  api_path="$1"
  shift
  case "$api_path" in
    /client/v4/graphql) ;;
    *) echo "[cf.sh] api-post only allows /client/v4/graphql" >&2; exit 64 ;;
  esac
  if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
    exec bash -c '
      set -euo pipefail
      api_path="$1"
      shift
      curl -fsS -X POST \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}" \
        -H "Content-Type: application/json" \
        "$@" \
        "https://api.cloudflare.com$api_path"
    ' _ "$api_path" "$@"
  fi
  exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- bash -c '
    set -euo pipefail
    api_path="$1"
    shift
    curl -fsS -X POST \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}" \
      -H "Content-Type: application/json" \
      "$@" \
      "https://api.cloudflare.com$api_path"
  ' _ "$api_path" "$@"
fi

if [ "$1" = "d1:apply-prod" ]; then
  shift
  exec bash "$REPO_ROOT/scripts/d1/apply-prod.sh" "$@"
fi

if [ "$1" = "r2" ]; then
  shift
  if [ "$#" -lt 1 ]; then
    echo "usage: $0 r2 <export|restore> [--env <production|preview>] [--dry-run] [--random-pick N] [--no-verify] [--force]" >&2
    exit 64
  fi
  sub="$1"; shift
  case "$sub" in
    export)   r2_script_path="$REPO_ROOT/scripts/cf-audit-log/cli/export.ts" ;;
    restore)  r2_script_path="$REPO_ROOT/scripts/cf-audit-log/cli/restore.ts" ;;
    *)
      echo "[cf.sh] unknown r2 subcommand: $sub" >&2
      exit 64
      ;;
  esac
  if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
    exec mise exec -- pnpm exec tsx "$r2_script_path" "$@"
  fi
  exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- pnpm exec tsx "$r2_script_path" "$@"
fi

if [ "$1" = "audit-log" ]; then
  shift
  if [ "$#" -lt 1 ]; then
    echo "usage: $0 audit-log <fetch|analyze|baseline|whoami> [--flags...]" >&2
    exit 64
  fi
  sub="$1"; shift
  if [ "$sub" = "whoami" ]; then
    if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
      exec env CLOUDFLARE_API_TOKEN="${CF_AUDIT_TOKEN_PROD:?CF_AUDIT_TOKEN_PROD is required}" "$REPO_ROOT/scripts/cf.sh" whoami "$@"
    fi
    exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- bash -c '
      set -euo pipefail
      exec env CF_SH_SKIP_WITH_ENV=1 \
        CLOUDFLARE_API_TOKEN="${CF_AUDIT_TOKEN_PROD:?CF_AUDIT_TOKEN_PROD is required}" \
        bash "$1" whoami "${@:2}"
    ' _ "$REPO_ROOT/scripts/cf.sh" "$@"
  fi
  case "$sub" in
    fetch)    script_path="$REPO_ROOT/scripts/cf-audit-log/fetch.ts" ;;
    analyze)  script_path="$REPO_ROOT/scripts/cf-audit-log/analyze.ts" ;;
    baseline) script_path="$REPO_ROOT/scripts/cf-audit-log/baseline-cli.ts" ;;
    *)
      echo "[cf.sh] unknown audit-log subcommand: $sub" >&2
      exit 64
      ;;
  esac
  if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
    exec mise exec -- pnpm exec tsx "$script_path" "$@"
  fi
  exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- pnpm exec tsx "$script_path" "$@"
fi

# ローカル wrangler を優先 (グローバルは依存解決が外側に漏れて不安定)
LOCAL_WRANGLER="$REPO_ROOT/node_modules/.bin/wrangler"
if [ -x "$LOCAL_WRANGLER" ]; then
  WRANGLER_BIN="$LOCAL_WRANGLER"
else
  WRANGLER_BIN="wrangler"
fi

if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
  exec "$WRANGLER_BIN" "$@"
fi

# with-env.sh が op run で .env (op:// 参照のみ) を解決して env に注入する
# ESBUILD_BINARY_PATH は親 export 済みなので op run 経由でも子に継承される
exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- "$WRANGLER_BIN" "$@"
