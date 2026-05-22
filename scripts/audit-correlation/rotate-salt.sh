#!/usr/bin/env bash
# AUDIT_CORRELATION_SALT rotation orchestrator.
# Modes:
#   --dry-run       : 予定アクションを stdout に列挙する（副作用なし）
#   --apply         : 新 salt を生成し 1Password / Cloudflare Secrets に反映、_PREVIOUS を退避
#   --rollback      : 直前の rotation を取り消し（_PREVIOUS を current に書き戻す）
#   --end-rotation  : dual-hash 期間終了。_PREVIOUS を 1Password / Cloudflare Secrets から削除
#   --confirm-production : production の mutating mode を明示許可
#
# Exit codes:
#   0 success / 1 設定不備 (引数・前提) / 2 op CLI 失敗 / 3 cf.sh 失敗
#
# 不変条件:
#   - salt 実値はディスク・ログに残さない (環境変数経由のみ・stderr/stdout への出力禁止)
#   - wrangler 直接呼び出し禁止 (scripts/cf.sh 経由)
#   - 1Password 経路: op item get/edit/create
set -euo pipefail

readonly SCRIPT_NAME="rotate-salt.sh"
readonly OP_VAULT_DEFAULT="CloudflareSecurity"
readonly OP_ITEM_CURRENT="AuditCorrelationSalt"
readonly OP_ITEM_PREVIOUS="AuditCorrelationSaltPrevious"
readonly SECRET_NAME="AUDIT_CORRELATION_SALT"
readonly SECRET_NAME_PREVIOUS="AUDIT_CORRELATION_SALT_PREVIOUS"

usage() {
  cat <<'EOF'
Usage: rotate-salt.sh <mode> [--env <staging|production>] [--vault <name>] [--confirm-production]

Modes:
  --dry-run       Print planned actions only (no side effects)
  --apply         Generate new salt, archive current as _PREVIOUS, push to Cloudflare
  --rollback      Revert the most recent rotation
  --end-rotation  Remove _PREVIOUS to end dual-hash window

Examples:
  bash scripts/audit-correlation/rotate-salt.sh --dry-run --env staging
  bash scripts/audit-correlation/rotate-salt.sh --apply --env staging
  bash scripts/audit-correlation/rotate-salt.sh --end-rotation --env staging
EOF
}

log_info() { echo "[$SCRIPT_NAME] $*" >&2; }
log_err() { echo "[$SCRIPT_NAME][ERROR] $*" >&2; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log_err "required command not found: $1"
    exit 1
  }
}

generate_salt() {
  # 32 byte / 64 hex chars; openssl が無い環境では /dev/urandom にフォールバック
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    head -c 32 /dev/urandom | od -An -vtx1 | tr -d ' \n'
  fi
}

op_whoami_or_die() {
  if ! op whoami >/dev/null 2>&1; then
    log_err "op CLI not signed in. Run: eval \$(op signin)"
    exit 2
  fi
}

cf_secret_put() {
  # $1 = secret name, $2 = env (staging|production), reads value from stdin
  local name="$1" env="$2"
  if ! bash scripts/cf.sh secret put "$name" --config apps/api/wrangler.toml --env "$env"; then
    log_err "cf.sh secret put failed for $name (env=$env)"
    exit 3
  fi
}

cf_secret_delete() {
  local name="$1" env="$2"
  bash scripts/cf.sh secret delete "$name" --config apps/api/wrangler.toml --env "$env"
}

mode=""
env_name=""
vault="$OP_VAULT_DEFAULT"
confirm_production=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|--apply|--rollback|--end-rotation)
      if [[ -n "$mode" ]]; then
        log_err "multiple modes specified"
        exit 1
      fi
      mode="${1#--}"
      shift
      ;;
    --env)
      env_name="${2:-}"
      shift 2 || { usage; exit 1; }
      ;;
    --vault)
      vault="${2:-}"
      shift 2 || { usage; exit 1; }
      ;;
    --confirm-production)
      confirm_production=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log_err "unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$mode" ]]; then
  usage
  exit 1
fi
if [[ -z "$env_name" ]]; then
  log_err "--env <staging|production> is required"
  exit 1
fi
if [[ "$env_name" != "staging" && "$env_name" != "production" ]]; then
  log_err "--env must be staging or production (got: $env_name)"
  exit 1
fi
if [[ "$env_name" = "production" && "$mode" != "dry-run" && "$confirm_production" != "1" ]]; then
  log_err "production mutation requires --confirm-production"
  exit 1
fi

require_cmd op
require_cmd bash

case "$mode" in
  dry-run)
    cat <<EOF
[dry-run] env=$env_name vault=$vault
[dry-run] would: op whoami
[dry-run] would: read current salt from op://$vault/$OP_ITEM_CURRENT/value
[dry-run] would: copy current salt -> op://$vault/$OP_ITEM_PREVIOUS/value
[dry-run] would: generate new 64-hex salt
[dry-run] would: write new salt -> op://$vault/$OP_ITEM_CURRENT/value
[dry-run] would: bash scripts/cf.sh secret put $SECRET_NAME --env $env_name (stdin: new salt)
[dry-run] would: bash scripts/cf.sh secret put $SECRET_NAME_PREVIOUS --env $env_name (stdin: old salt)
[dry-run] no side effects performed
EOF
    exit 0
    ;;
  apply)
    op_whoami_or_die
    log_info "fetching current salt from 1Password (vault=$vault)"
    current_salt=$(op read "op://$vault/$OP_ITEM_CURRENT/value" 2>/dev/null) || {
      log_err "failed to read current salt from op"
      exit 2
    }
    [[ -n "$current_salt" ]] || { log_err "current salt is empty"; exit 2; }
    new_salt=$(generate_salt)

    log_info "archiving current salt to $OP_ITEM_PREVIOUS"
    if op item get "$OP_ITEM_PREVIOUS" --vault "$vault" >/dev/null 2>&1; then
      op item edit "$OP_ITEM_PREVIOUS" --vault "$vault" "value=$current_salt" >/dev/null \
        || { log_err "op item edit failed for $OP_ITEM_PREVIOUS"; exit 2; }
    else
      op item create --vault "$vault" --category "API Credential" --title "$OP_ITEM_PREVIOUS" "value=$current_salt" >/dev/null \
        || { log_err "op item create failed for $OP_ITEM_PREVIOUS"; exit 2; }
    fi

    log_info "writing new salt to $OP_ITEM_CURRENT"
    op item edit "$OP_ITEM_CURRENT" --vault "$vault" "value=$new_salt" >/dev/null \
      || { log_err "op item edit failed for $OP_ITEM_CURRENT"; exit 2; }

    log_info "pushing new salt to Cloudflare Secrets ($env_name)"
    printf '%s' "$new_salt" | cf_secret_put "$SECRET_NAME" "$env_name"
    log_info "pushing previous salt to Cloudflare Secrets ($SECRET_NAME_PREVIOUS, $env_name)"
    printf '%s' "$current_salt" | cf_secret_put "$SECRET_NAME_PREVIOUS" "$env_name"

    unset current_salt new_salt
    log_info "apply complete (dual-hash window started)"
    exit 0
    ;;
  rollback)
    op_whoami_or_die
    log_info "rolling back: restoring $OP_ITEM_PREVIOUS as $OP_ITEM_CURRENT"
    previous_salt=$(op read "op://$vault/$OP_ITEM_PREVIOUS/value" 2>/dev/null) || {
      log_err "failed to read previous salt; rollback impossible"
      exit 2
    }
    [[ -n "$previous_salt" ]] || { log_err "previous salt is empty"; exit 2; }

    op item edit "$OP_ITEM_CURRENT" --vault "$vault" "value=$previous_salt" >/dev/null \
      || { log_err "op item edit failed for $OP_ITEM_CURRENT"; exit 2; }

    printf '%s' "$previous_salt" | cf_secret_put "$SECRET_NAME" "$env_name"
    if ! cf_secret_delete "$SECRET_NAME_PREVIOUS" "$env_name"; then
      log_info "$SECRET_NAME_PREVIOUS delete failed or was already absent; continuing rollback"
    fi

    unset previous_salt
    log_info "rollback complete"
    exit 0
    ;;
  end-rotation)
    op_whoami_or_die
    log_info "ending rotation: removing $SECRET_NAME_PREVIOUS"
    if ! cf_secret_delete "$SECRET_NAME_PREVIOUS" "$env_name"; then
      log_info "$SECRET_NAME_PREVIOUS delete failed or was already absent; continuing end-rotation"
    fi
    if op item get "$OP_ITEM_PREVIOUS" --vault "$vault" >/dev/null 2>&1; then
      op item delete "$OP_ITEM_PREVIOUS" --vault "$vault" >/dev/null \
        || log_info "op item delete failed (item may not exist); continuing"
    fi
    log_info "end-rotation complete (single-hash mode active after Worker redeploy)"
    exit 0
    ;;
  *)
    usage
    exit 1
    ;;
esac
