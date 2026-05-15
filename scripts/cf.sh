#!/usr/bin/env bash
# Cloudflare wrangler ラッパー
# - シークレットは 1Password CLI 経由 (`scripts/with-env.sh` → `op run --env-file=.env`) で動的注入
# - `.env` には実値を絶対に書かない (AI 学習混入防止) — op:// 参照のみ可
# - ローカル node_modules/.bin/wrangler を優先使用 (グローバル wrangler は esbuild 不整合の元)
# - グローバル/サブパッケージ esbuild とのバージョン不整合を ESBUILD_BINARY_PATH で自動解決
# - OpenNext build の host/binary mismatch 再発時は root package.json の pnpm.overrides.esbuild を
#   @opennextjs/aws が使用する esbuild version に合わせ、pnpm install 後に build:cloudflare を再検証する
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

if [ "$1" != "alerts" ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
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

set_tsx_esbuild_binary_path() {
  local tsx_esbuild_parent="$REPO_ROOT/node_modules/esbuild/node_modules/@esbuild"
  for p in darwin-arm64 darwin-x64 linux-x64 linux-arm64; do
    local candidate="$tsx_esbuild_parent/$p/bin/esbuild"
    if [ -f "$candidate" ]; then
      export ESBUILD_BINARY_PATH="$candidate"
      return 0
    fi
  done
}

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
  set_tsx_esbuild_binary_path
  if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
    exec mise exec -- pnpm exec tsx "$r2_script_path" "$@"
  fi
  exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- pnpm exec tsx "$r2_script_path" "$@"
fi

if [ "$1" = "alerts" ]; then
  shift
  # UT-17-Followup-004: Cloudflare Notification Policy IaC
  # Subcommands: list / diff / plan / apply
  cf_alerts_usage() {
    cat >&2 <<'EOF'
usage: cf.sh alerts {list|diff|apply|plan} [--json] [--yes] [--ci]
  list             expected (repo) と actual (Cloudflare) を一覧表示
  diff             expected と actual を比較。drift があれば exit 2
  plan             diff と同じ判定だが exit 常に 0 (CI plan 出力用)
  apply            webhook destination → policy の順に冪等適用 (dry-run by default)
                   --yes で実適用 / --ci で op run をスキップ
EOF
  }
  if [ "$#" -eq 0 ]; then
    cf_alerts_usage
    exit 64
  fi
  alerts_sub="$1"; shift || true
  case "$alerts_sub" in
    list|diff|plan|apply) ;;
    *)
      echo "[cf.sh] unknown subcommand: $alerts_sub" >&2
      cf_alerts_usage
      exit 64
      ;;
  esac
  set_tsx_esbuild_binary_path
  alerts_cli="$REPO_ROOT/infra/cloudflare-alerts/lib/cli.ts"

  # --ci: op run をスキップし、CLOUDFLARE_ALERTS_TOKEN_READ を直接利用
  alerts_is_ci=0
  for a in "$@"; do
    if [ "$a" = "--ci" ]; then alerts_is_ci=1; fi
  done
  if [ "$alerts_is_ci" = "1" ]; then
    if [ "$alerts_sub" = "apply" ]; then
      echo "[cf.sh] alerts apply is forbidden in --ci mode; CI drift checks are read-only" >&2
      exit 78
    fi
    if [ -z "${CLOUDFLARE_ALERTS_TOKEN_READ:-}" ]; then
      echo "[cf.sh] CLOUDFLARE_ALERTS_TOKEN_READ is required in --ci mode" >&2
      exit 78
    fi
    echo "[cf.sh] CI mode: skipping op run" >&2
    export CF_ALERTS_CI_MODE=1
    if command -v mise >/dev/null 2>&1; then
      exec mise exec -- pnpm exec tsx "$alerts_cli" "$alerts_sub" "$@"
    else
      exec pnpm exec tsx "$alerts_cli" "$alerts_sub" "$@"
    fi
  fi

  # SKIP_WITH_ENV モード (テスト用 / CI で env を別経路から注入する場合)
  # mise が無い環境 (GitHub Actions runner 等) でも動くよう mise を optional 扱い
  if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
    if command -v mise >/dev/null 2>&1; then
      exec mise exec -- pnpm exec tsx "$alerts_cli" "$alerts_sub" "$@"
    else
      exec pnpm exec tsx "$alerts_cli" "$alerts_sub" "$@"
    fi
  fi

  # 通常モード: op run 経由で .env (op:// 参照) を解決
  exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- pnpm exec tsx "$alerts_cli" "$alerts_sub" "$@"
fi

if [ "$1" = "audit-log" ]; then
  shift
  if [ "$#" -lt 1 ]; then
    echo "usage: $0 audit-log <fetch|analyze|baseline|feature-export|whoami> [--flags...]" >&2
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
    feature-export) script_path="$REPO_ROOT/scripts/cf-audit-log/feature-export.ts" ;;
    *)
      echo "[cf.sh] unknown audit-log subcommand: $sub" >&2
      exit 64
      ;;
  esac
  set_tsx_esbuild_binary_path
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

if [ "$1" = "deploy" ] && printf '%s\n' "$@" | grep -qx -- "--config"; then
  config_path=""
  deploy_env=""
  prev=""
  for arg in "$@"; do
    if [ "$prev" = "--config" ]; then
      config_path="$arg"
    elif [ "$prev" = "--env" ]; then
      deploy_env="$arg"
    fi
    prev="$arg"
  done
  if [ "$config_path" = "apps/web/wrangler.toml" ] && [ "${deploy_env:-production}" = "production" ] && [ "${ENABLE_STAGING_SMOKE_FIXTURE:-}" = "1" ]; then
    echo "[cf.sh] refusing production web deploy with ENABLE_STAGING_SMOKE_FIXTURE=1" >&2
    exit 64
  fi
fi

if [ "${CF_SH_SKIP_WITH_ENV:-0}" = "1" ]; then
  exec "$WRANGLER_BIN" "$@"
fi

# with-env.sh が op run で .env (op:// 参照のみ) を解決して env に注入する
# ESBUILD_BINARY_PATH は親 export 済みなので op run 経由でも子に継承される
exec "$REPO_ROOT/scripts/with-env.sh" mise exec -- "$WRANGLER_BIN" "$@"
