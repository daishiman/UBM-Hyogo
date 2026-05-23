#!/usr/bin/env bash
# Google Service Account JSON key rotation helper.
set -euo pipefail

SECRET_NAME="GOOGLE_SERVICE_ACCOUNT_JSON"
WRANGLER_CONFIG="apps/api/wrangler.toml"
CF_WRAPPER_PATH="${CF_ROTATE_CF_SH:-scripts/cf.sh}"
STATE_DIR="${CF_ROTATE_STATE_DIR:-${TMPDIR:-/tmp}}"
STATE_FILE="$STATE_DIR/cf-rotate-sa-key.staging-verified"
STAGING_PUT_FILE="$STATE_DIR/cf-rotate-sa-key.staging-put"

run_cf() {
  bash "$CF_WRAPPER_PATH" "$@"
}

usage() {
  cat >&2 <<'EOF'
usage:
  cf-rotate-sa-key.sh fingerprint
  cf-rotate-sa-key.sh put-staging --op-ref <op://...> --fingerprint <16-hex> --env staging [--dry-run]
  cf-rotate-sa-key.sh put-production --op-ref <op://...> --fingerprint <16-hex> --env production [--dry-run]
  cf-rotate-sa-key.sh verify --env <staging|production>
  cf-rotate-sa-key.sh tail --env <staging|production> [--seconds N]

Secret values must be supplied on stdin. The helper never accepts a literal
secret value as an argument.
EOF
}

enforce_history_off() {
  export HISTFILE=/dev/null
  set +o history 2>/dev/null || true
}

assert_stdin_piped() {
  if [[ -t 0 ]]; then
    echo "ERROR: stdin must be piped; do not paste secret values into a TTY" >&2
    exit 2
  fi
}

validate_env() {
  case "${1:-}" in
    staging|production) ;;
    *) echo "ERROR: --env must be staging or production" >&2; exit 64 ;;
  esac
}

require_op_ref() {
  local op_ref="${1:-}"
  if [[ -z "$op_ref" || "$op_ref" != op://* ]]; then
    echo "ERROR: --op-ref op://... is required for audit-safe provenance" >&2
    exit 64
  fi
}

require_fingerprint() {
  local fingerprint="${1:-}"
  if [[ ! "$fingerprint" =~ ^[a-f0-9]{16}$ ]]; then
    echo "ERROR: --fingerprint must be a 16 character lowercase hex value" >&2
    exit 64
  fi
}

secure_temp_file() {
  local tmp
  tmp="$(mktemp "${TMPDIR:-/tmp}/sa-key.XXXXXX")"
  chmod 600 "$tmp"
  printf '%s\n' "$tmp"
}

read_secret_to_temp() {
  assert_stdin_piped
  local tmp="$1"
  cat >"$tmp"
  if [[ ! -s "$tmp" ]]; then
    rm -f "$tmp"
    echo "ERROR: stdin was empty; refusing to put an empty secret" >&2
    exit 3
  fi
}

compute_fingerprint_file() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print substr($1,1,16)}'
  else
    shasum -a 256 "$file" | awk '{print substr($1,1,16)}'
  fi
}

compute_fingerprint() {
  enforce_history_off
  local tmp
  tmp="$(secure_temp_file)"
  read_secret_to_temp "$tmp"
  compute_fingerprint_file "$tmp"
  rm -f "$tmp"
}

parse_put_args() {
  DRY_RUN=0
  OP_REF=""
  FINGERPRINT=""
  ENV_TARGET=""
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --dry-run) DRY_RUN=1; shift ;;
      --op-ref) OP_REF="${2:-}"; shift 2 ;;
      --fingerprint) FINGERPRINT="${2:-}"; shift 2 ;;
      --env) ENV_TARGET="${2:-}"; shift 2 ;;
      *) echo "ERROR: unknown argument: $1" >&2; usage; exit 64 ;;
    esac
  done
  require_op_ref "$OP_REF"
  require_fingerprint "$FINGERPRINT"
  validate_env "$ENV_TARGET"
}

state_value() {
  local key="$1" file="$2"
  grep -E "^${key}=" "$file" | tail -n 1 | cut -d= -f2-
}

write_staging_state() {
  mkdir -p "$STATE_DIR"
  umask 077
  {
    printf 'env=staging\n'
    printf 'secret=%s\n' "$SECRET_NAME"
    printf 'config=%s\n' "$WRANGLER_CONFIG"
    if [[ -f "$STAGING_PUT_FILE" ]]; then
      grep -E '^(put_at|put_at_epoch|op_ref|fingerprint)=' "$STAGING_PUT_FILE"
    fi
    date -u '+verified_at_epoch=%s'
    date -u '+verified_at=%Y-%m-%dT%H:%M:%SZ'
  } >"$STATE_FILE"
}

write_staging_put_state() {
  mkdir -p "$STATE_DIR"
  umask 077
  {
    printf 'env=staging\n'
    printf 'secret=%s\n' "$SECRET_NAME"
    printf 'config=%s\n' "$WRANGLER_CONFIG"
    printf 'op_ref=%s\n' "$OP_REF"
    printf 'fingerprint=%s\n' "$FINGERPRINT"
    date -u '+put_at_epoch=%s'
    date -u '+put_at=%Y-%m-%dT%H:%M:%SZ'
  } >"$STAGING_PUT_FILE"
}

require_staging_put_state() {
  if [[ ! -f "$STAGING_PUT_FILE" ]]; then
    echo "ERROR: staging put state not found; run a real put-staging before verify" >&2
    exit 7
  fi
  grep -Fq "secret=$SECRET_NAME" "$STAGING_PUT_FILE" || {
    echo "ERROR: staging put state does not match $SECRET_NAME" >&2
    exit 7
  }
  grep -Fq "config=$WRANGLER_CONFIG" "$STAGING_PUT_FILE" || {
    echo "ERROR: staging put state does not match $WRANGLER_CONFIG" >&2
    exit 7
  }
}

require_staging_state() {
  if [[ ! -f "$STATE_FILE" ]]; then
    echo "ERROR: staging verification state not found; run put-staging and verify staging first" >&2
    exit 7
  fi
  grep -Fq "secret=$SECRET_NAME" "$STATE_FILE" || {
    echo "ERROR: staging state does not match $SECRET_NAME" >&2
    exit 7
  }
  grep -Fq "config=$WRANGLER_CONFIG" "$STATE_FILE" || {
    echo "ERROR: staging state does not match $WRANGLER_CONFIG" >&2
    exit 7
  }
  if [[ "$(state_value op_ref "$STATE_FILE")" != "$OP_REF" ]]; then
    echo "ERROR: production op-ref does not match verified staging op-ref" >&2
    exit 7
  fi
  if [[ "$(state_value fingerprint "$STATE_FILE")" != "$FINGERPRINT" ]]; then
    echo "ERROR: production fingerprint does not match verified staging fingerprint" >&2
    exit 7
  fi
  local verified_at_epoch now max_age_seconds
  verified_at_epoch="$(state_value verified_at_epoch "$STATE_FILE")"
  now="$(date -u '+%s')"
  max_age_seconds="${CF_ROTATE_STATE_MAX_AGE_SECONDS:-21600}"
  if [[ ! "$verified_at_epoch" =~ ^[0-9]+$ ]] || (( now - verified_at_epoch > max_age_seconds )); then
    echo "ERROR: staging verification state is expired; rerun staging verify" >&2
    exit 7
  fi
}

put_secret() {
  local target_env="$1"
  shift
  parse_put_args "$@"
  if [[ "$target_env" != "$ENV_TARGET" ]]; then
    echo "ERROR: subcommand target and --env do not match" >&2
    exit 64
  fi
  if [[ "$target_env" == "production" ]]; then
    require_staging_state
  fi

  enforce_history_off
  assert_stdin_piped

  if [[ "$DRY_RUN" -eq 1 ]]; then
    cat >/dev/null
    printf '[DRY-RUN] would put %s to %s via scripts/cf.sh; op_ref=%s\n' \
      "$SECRET_NAME" "$target_env" "$OP_REF"
    return 0
  fi

  if ! run_cf secret put "$SECRET_NAME" --config "$WRANGLER_CONFIG" --env "$target_env"; then
    echo "ERROR: cf.sh secret put failed for env=$target_env" >&2
    exit 4
  fi
  [[ "$target_env" == "staging" ]] && write_staging_put_state
  printf 'put_complete env=%s secret=%s\n' "$target_env" "$SECRET_NAME"
  if [[ "$target_env" == "production" ]]; then
    rm -f "$STAGING_PUT_FILE" "$STATE_FILE"
  fi
}

verify_name() {
  local env_target=""
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --env) env_target="${2:-}"; shift 2 ;;
      *) echo "ERROR: unknown argument: $1" >&2; usage; exit 64 ;;
    esac
  done
  validate_env "$env_target"
  [[ "$env_target" == "staging" ]] && require_staging_put_state
  run_cf secret list --config "$WRANGLER_CONFIG" --env "$env_target" \
    | grep -Eq "^${SECRET_NAME}([[:space:]]|$)" || exit 5
  [[ "$env_target" == "staging" ]] && write_staging_state
}

run_with_timeout() {
  local seconds="$1"
  shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "$seconds" "$@"
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout "$seconds" "$@"
  else
    perl -e '
      use strict;
      use warnings;
      my $seconds = shift @ARGV;
      my $pid = fork();
      die "fork failed\n" unless defined $pid;
      if ($pid == 0) {
        exec @ARGV;
        exit 127;
      }
      local $SIG{ALRM} = sub {
        kill "TERM", $pid;
        exit 124;
      };
      alarm $seconds;
      waitpid($pid, 0);
      exit($? >> 8);
    ' "$seconds" "$@"
  fi
}

tail_window() {
  local env_target="" seconds="60"
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --env) env_target="${2:-}"; shift 2 ;;
      --seconds) seconds="${2:-}"; shift 2 ;;
      *) echo "ERROR: unknown argument: $1" >&2; usage; exit 64 ;;
    esac
  done
  validate_env "$env_target"
  [[ "$seconds" =~ ^[0-9]+$ ]] || { echo "ERROR: --seconds must be numeric" >&2; exit 64; }
  if ! run_with_timeout "$seconds" bash "$CF_WRAPPER_PATH" tail --config "$WRANGLER_CONFIG" --env "$env_target"; then
    exit 6
  fi
}

dispatch() {
  case "${1:-}" in
    fingerprint) shift; compute_fingerprint "$@" ;;
    put-staging) shift; put_secret staging "$@" ;;
    put-production) shift; put_secret production "$@" ;;
    verify) shift; verify_name "$@" ;;
    tail) shift; tail_window "$@" ;;
    -h|--help|"") usage; exit 64 ;;
    *) echo "ERROR: unknown subcommand: $1" >&2; usage; exit 64 ;;
  esac
}

if [[ "${1:-}" == "--source-only" ]]; then
  # shellcheck disable=SC2317
  return 0 2>/dev/null || exit 0
fi

dispatch "$@"
