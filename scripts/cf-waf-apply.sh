#!/usr/bin/env bash
# UT-15 Phase 4 F-01: Cloudflare WAF / Rate Limiting 宣言的適用スクリプト。
# - secret 値は op run 経由で env 注入。stdout / stderr / file には絶対出さない。
# - wrangler を直接呼ばず、Cloudflare Rulesets API payload を宣言的に生成する。
# - 現 wave は dry-run / config contract まで。実 Cloudflare mutation は G1 approval 後に実装する。
#
# usage:
#   bash scripts/cf-waf-apply.sh --mode <simulate|enforce> [--dry-run]
#                                [--env <staging|production>] [--zone <ZONE_ID>]
#                                [--config <path/to/config.json>]
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LIB_DIR="$REPO_ROOT/scripts/cf-waf-apply"
CONFIG_DEFAULT="$LIB_DIR/config.json"

# shellcheck source=scripts/cf-waf-apply/lib.sh
. "$LIB_DIR/lib.sh"

MODE=""
DRY_RUN=0
ENV_NAME="staging"
ZONE_FILTER=""
CONFIG_PATH="$CONFIG_DEFAULT"

usage() {
  cat <<'EOF' >&2
usage: scripts/cf-waf-apply.sh --mode <simulate|enforce> [--dry-run]
                               [--env <staging|production>] [--zone <ZONE_ID>]
                               [--config <path>]
exit codes:
   0  ok
   1  generic / arg
  11  token / secret 未注入
  12  config schema 不正
  13  Cloudflare API エラー
  14  dry-run 差分あり (CI gate 用)
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --mode) MODE="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --env) ENV_NAME="${2:-}"; shift 2 ;;
    --zone) ZONE_FILTER="${2:-}"; shift 2 ;;
    --config) CONFIG_PATH="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "[cf-waf-apply] unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [ "$MODE" != "simulate" ] && [ "$MODE" != "enforce" ]; then
  echo "[cf-waf-apply] --mode is required (simulate|enforce)" >&2
  usage; exit 1
fi

preflight_check >/dev/null

CONFIG_JSON="$(load_config "$CONFIG_PATH")"
EXPECTED_JSON="$(normalize_expected "$CONFIG_JSON" "$MODE")"

ZONES_JSON="$(printf '%s' "$CONFIG_JSON" | jq -c '.zones')"

if [ "$DRY_RUN" = "1" ]; then
  DIFF_JSON="$(jq -n \
    --argjson z "$ZONES_JSON" \
    --argjson expected "$EXPECTED_JSON" \
    --arg env "$ENV_NAME" \
    --arg mode "$MODE" \
    --arg zoneFilter "$ZONE_FILTER" \
    '{
       env: $env,
       mode: $mode,
       zoneFilter: ( if $zoneFilter == "" then null else $zoneFilter end ),
       zones: $z,
       expected: $expected,
       dryRun: true
     }')"
  print_dry_run "$DIFF_JSON"
  if [ "${CF_WAF_FORCE_DIFF:-0}" = "1" ]; then
    exit "$EXIT_DIFF"
  fi
  exit 0
fi

cf_waf_die "$EXIT_API" "non-dry-run Cloudflare mutation is not implemented in this local wave; run --dry-run or wait for Phase 13 G1 approval"
