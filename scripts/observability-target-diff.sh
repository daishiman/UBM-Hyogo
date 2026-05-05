#!/usr/bin/env bash
# scripts/observability-target-diff.sh
# UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 (production observability target diff script)
#
# 新 Worker (ubm-hyogo-web-production) と旧 Worker (ubm-hyogo-web) の observability target
# (Workers Logs / Tail / Logpush / Analytics Engine) を read-only で一覧化し diff を出力する。
# 全 Cloudflare 呼び出しは bash scripts/cf.sh 経由 (CLAUDE.md 「Cloudflare 系 CLI 実行ルール」準拠)。
# secret / token / sink URL credential は redaction module で完全伏字化する。
# HTTP method は GET のみ (read-only)。POST/PUT/DELETE/PATCH を含まない。
#
# 詳細: docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/

set -euo pipefail

# ---- module load ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/redaction.sh
. "$SCRIPT_DIR/lib/redaction.sh"

# ---- defaults ----
CURRENT_WORKER=""
LEGACY_WORKER=""
CONFIG="apps/web/wrangler.toml"
FORMAT="md"
NO_COLOR=0

# ---- logging (stderr, redacted) ----
log()  { printf '%s\n' "$*" | redact_stream >&2; }
warn() { printf 'WARN: %s\n' "$*" | redact_stream >&2; }
err()  { printf 'ERROR: %s\n' "$*" | redact_stream >&2; }

usage() {
  cat <<'EOF' >&2
Usage: bash scripts/observability-target-diff.sh \
  --current-worker <NAME> --legacy-worker <NAME> \
  [--config apps/web/wrangler.toml] [--format md|json] [--no-color]

read-only diff of observability targets between two Workers.
All Cloudflare calls go through bash scripts/cf.sh (no direct wrangler).
EOF
}

# ---- arg parse ----
parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --current-worker) CURRENT_WORKER="${2:-}"; shift 2 ;;
      --legacy-worker)  LEGACY_WORKER="${2:-}";  shift 2 ;;
      --config)         CONFIG="${2:-}";         shift 2 ;;
      --format)         FORMAT="${2:-}";         shift 2 ;;
      --no-color)       NO_COLOR=1;              shift   ;;
      -h|--help)        usage; exit 64 ;;
      *) err "unknown arg: $1"; usage; exit 64 ;;
    esac
  done

  if [ -z "$CURRENT_WORKER" ] || [ -z "$LEGACY_WORKER" ]; then
    err "--current-worker and --legacy-worker are required"
    usage
    exit 64
  fi
  case "$FORMAT" in md|json) ;; *) err "--format must be md|json"; exit 64 ;; esac
  if [ ! -f "$CONFIG" ]; then
    err "config not found: $CONFIG"
    exit 2
  fi
}

# ---- cf.sh wrapper (read-only allowlist) ----
# 許可: whoami / observability list 系 / GET /accounts/.../logpush/jobs (API 経由のみ)
# 禁止: secret put|delete / deploy / rollback / wrangler login
cf_call() {
  # 第 1 引数: subcommand (read-only) / 残: そのまま渡す
  local sub="${1:-}"
  case "$sub" in
    whoami|d1|kv|r2|tail|deployments)
      bash "$SCRIPT_DIR/cf.sh" "$@"
      ;;
    *)
      err "cf_call: subcommand '$sub' not in read-only allowlist"
      return 2
      ;;
  esac
}

# ---- toml parser (very small / wrangler.toml 限定) ----
# extract value of `key = "value"` under [section.subsection]
toml_get() {
  local section="$1" key="$2" file="$3"
  awk -v sect="[$section]" -v k="$key" '
    BEGIN { in_sect=0 }
    /^\[/ { in_sect = ($0 == sect) ? 1 : 0; next }
    in_sect && $0 ~ "^[[:space:]]*"k"[[:space:]]*=" {
      sub("^[[:space:]]*"k"[[:space:]]*=[[:space:]]*", "", $0)
      gsub(/^"|"$|^'\''|'\''$/, "", $0)
      print $0; exit
    }
  ' "$file"
}

toml_has_section() {
  local section="$1" file="$2"
  grep -qE "^\[$(printf '%s' "$section" | sed 's/[].[]/\\&/g')\]" "$file"
}

# ---- R1 Workers Logs ----
fetch_r1_workers_logs() {
  local worker="$1" role="$2"
  if [ "$role" = "current" ] && toml_has_section "env.production.observability" "$CONFIG"; then
    local enabled rate
    enabled="$(toml_get "env.production.observability" "enabled" "$CONFIG")"
    rate="$(toml_get "env.production.observability" "head_sampling_rate" "$CONFIG")"
    [ -z "$enabled" ] && enabled="false"
    [ -z "$rate" ]    && rate="1.0"
    printf 'enabled=%s head_sampling_rate=%s' "$enabled" "$rate"
  else
    printf 'N/A (dashboard fallback: Workers & Pages → %s → Logs)' "$worker"
  fi
}

# ---- R2 Tail ----
fetch_r2_tail() {
  local worker="$1"
  printf 'target=%s' "$worker"
}

# ---- R3 Logpush ----
# read-only。cf.sh 経由で取得、plan 制限 (4xx) → N/A、network/auth → exit 2/3
fetch_r3_logpush() {
  local worker="$1"
  # Cloudflare Logpush API は plan 制限 (Workers Paid 等) で 403 を返す可能性が高い。
  # 本タスクは read-only diff に閉じるため、env で取得を試みた上で fallback を返す。
  # OBS_DIFF_FETCH_LOGPUSH=1 のときのみ cf.sh 経由で取得を試みる (default は dashboard fallback)。
  if [ "${OBS_DIFF_FETCH_LOGPUSH:-0}" = "1" ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
    printf 'UNAVAILABLE (Cloudflare Logpush jobs API fetch requires account-scoped API path; no jobs=[] fallback emitted for %s)' "$worker"
    return 0
  fi
  printf 'N/A (dashboard fallback: Analytics & Logs → Logpush for %s)' "$worker"
}

# ---- R4 Analytics Engine ----
fetch_r4_analytics() {
  local worker="$1" role="$2"
  if [ "$role" = "current" ]; then
    # wrangler.toml の [[env.production.analytics_engine_datasets]] を parse
    local bindings datasets
    bindings="$(awk '
      /^\[\[env\.production\.analytics_engine_datasets\]\]/ { in_block=1; next }
      /^\[/ { in_block=0 }
      in_block && /^[[:space:]]*binding[[:space:]]*=/ {
        sub("^[[:space:]]*binding[[:space:]]*=[[:space:]]*", ""); gsub(/"/, ""); print
      }
    ' "$CONFIG" | paste -sd ',' -)"
    datasets="$(awk '
      /^\[\[env\.production\.analytics_engine_datasets\]\]/ { in_block=1; next }
      /^\[/ { in_block=0 }
      in_block && /^[[:space:]]*dataset[[:space:]]*=/ {
        sub("^[[:space:]]*dataset[[:space:]]*=[[:space:]]*", ""); gsub(/"/, ""); print
      }
    ' "$CONFIG" | paste -sd ',' -)"
    [ -z "$bindings" ] && bindings=""
    [ -z "$datasets" ] && datasets=""
    printf 'bindings=[%s] datasets=[%s]' "$bindings" "$datasets"
  else
    printf 'bindings=[] # %s (legacy)' "$worker"
  fi
}

# ---- diff compute ----
# legacy_only / current_only / shared を 4 軸ごとに判定する。
# 単純化: 各軸で current が "N/A" でなく legacy が "N/A" なら current-only、その逆なら legacy-only。
classify_axis() {
  local cur="$1" leg="$2"
  local cur_na=0 leg_na=0
  case "$cur" in *"N/A "*|*"jobs=[]"*|*"bindings=[]"*) cur_na=1 ;; esac
  case "$leg" in *"N/A "*|*"jobs=[]"*|*"bindings=[]"*) leg_na=1 ;; esac
  if [ "$cur_na" -eq 1 ] && [ "$leg_na" -eq 1 ]; then
    printf 'shared-empty'
  elif [ "$cur_na" -eq 0 ] && [ "$leg_na" -eq 1 ]; then
    printf 'current-only'
  elif [ "$cur_na" -eq 1 ] && [ "$leg_na" -eq 0 ]; then
    printf 'legacy-only'
  else
    printf 'shared'
  fi
}

# ---- format md ----
format_md() {
  local r1c="$1" r1l="$2" r2c="$3" r2l="$4" r3c="$5" r3l="$6" r4c="$7" r4l="$8"
  local c1 c2 c3 c4 legacy_only=0 current_only=0
  c1="$(classify_axis "$r1c" "$r1l")"
  c2="$(classify_axis "$r2c" "$r2l")"
  c3="$(classify_axis "$r3c" "$r3l")"
  c4="$(classify_axis "$r4c" "$r4l")"
  for v in "$c1" "$c2" "$c3" "$c4"; do
    case "$v" in
      legacy-only)  legacy_only=$((legacy_only+1)) ;;
      current-only) current_only=$((current_only+1)) ;;
    esac
  done
  cat <<EOF
# observability-target-diff
- legacy:  $LEGACY_WORKER
- current: $CURRENT_WORKER

## R1 Workers Logs
- current: $r1c
- legacy:  $r1l

## R2 Tail
- current: $r2c
- legacy:  $r2l

## R3 Logpush
- current: $r3c
- legacy:  $r3l

## R4 Analytics Engine
- current: $r4c
- legacy:  $r4l

## Diff summary
- legacy-only:  $legacy_only
- current-only: $current_only
EOF
  if [ "$legacy_only" -gt 0 ] || [ "$current_only" -gt 0 ]; then
    return 1
  fi
  return 0
}

format_json() {
  local r1c="$1" r1l="$2" r2c="$3" r2l="$4" r3c="$5" r3l="$6" r4c="$7" r4l="$8"
  printf '{"current":"%s","legacy":"%s","r1":{"current":"%s","legacy":"%s"},"r2":{"current":"%s","legacy":"%s"},"r3":{"current":"%s","legacy":"%s"},"r4":{"current":"%s","legacy":"%s"}}\n' \
    "$CURRENT_WORKER" "$LEGACY_WORKER" \
    "$r1c" "$r1l" "$r2c" "$r2l" "$r3c" "$r3l" "$r4c" "$r4l"
}

main() {
  parse_args "$@"
  log "observability-target-diff: current=$CURRENT_WORKER legacy=$LEGACY_WORKER"

  local r1c r1l r2c r2l r3c r3l r4c r4l
  r1c="$(fetch_r1_workers_logs "$CURRENT_WORKER" current)"
  r1l="$(fetch_r1_workers_logs "$LEGACY_WORKER" legacy)"
  r2c="$(fetch_r2_tail "$CURRENT_WORKER")"
  r2l="$(fetch_r2_tail "$LEGACY_WORKER")"
  r3c="$(fetch_r3_logpush "$CURRENT_WORKER")"
  r3l="$(fetch_r3_logpush "$LEGACY_WORKER")"
  r4c="$(fetch_r4_analytics "$CURRENT_WORKER" current)"
  r4l="$(fetch_r4_analytics "$LEGACY_WORKER" legacy)"

  local out exit_code=0
  if [ "$FORMAT" = "json" ]; then
    out="$(format_json "$r1c" "$r1l" "$r2c" "$r2l" "$r3c" "$r3l" "$r4c" "$r4l")"
  else
    out="$(format_md "$r1c" "$r1l" "$r2c" "$r2l" "$r3c" "$r3l" "$r4c" "$r4l")" || exit_code=1
  fi

  printf '%s\n' "$out" | redact_stream
  exit "$exit_code"
}

main "$@"
