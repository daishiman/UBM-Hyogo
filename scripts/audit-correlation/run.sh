#!/usr/bin/env bash
# audit-correlation CLI runner
# Usage:
#   fixture mode:
#     scripts/audit-correlation/run.sh --github <gh.json> --cloudflare <cf.json> --salt <salt> [--previous-salt <salt>] [--out <out.json>]
#   live mode (Issue #553):
#     scripts/audit-correlation/run.sh --mode=live --endpoint <https://api.../internal/audit-correlation/run> --token-env AUDIT_CORRELATION_INTERNAL_TOKEN [--dry-run]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

MODE="fixture"
GITHUB=""
CLOUDFLARE=""
SALT=""
PREVIOUS_SALT="${AUDIT_CORRELATION_SALT_PREVIOUS:-}"
OUT=""
ENDPOINT=""
TOKEN_ENV=""
DRY_RUN="0"

usage() {
  cat <<'EOF' >&2
Usage:
  fixture: run.sh --github <gh.json> --cloudflare <cf.json> --salt <salt> [--previous-salt <salt>] [--out <out.json>]
  live:    run.sh --mode=live --endpoint <url> --token-env <ENV_NAME> [--dry-run]
exit codes: 0=success, 1=correlation failure, 2=invalid args
notes: live mode requires the env var named by --token-env to hold the Bearer token (its value is never echoed).
EOF
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode=*) MODE="${1#*=}"; shift 1 ;;
    --mode) MODE="${2:-}"; shift 2 ;;
    --github) GITHUB="${2:-}"; shift 2 ;;
    --cloudflare) CLOUDFLARE="${2:-}"; shift 2 ;;
    --salt) SALT="${2:-}"; shift 2 ;;
    --previous-salt) PREVIOUS_SALT="${2:-}"; shift 2 ;;
    --out) OUT="${2:-}"; shift 2 ;;
    --endpoint) ENDPOINT="${2:-}"; shift 2 ;;
    --token-env) TOKEN_ENV="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN="1"; shift 1 ;;
    -h|--help) usage ;;
    *) echo "unknown arg: $1" >&2; usage ;;
  esac
done

if [[ "$MODE" == "live" ]]; then
  if [[ -z "$ENDPOINT" || -z "$TOKEN_ENV" ]]; then
    usage
  fi
  # token は env 経由でのみ読む。値は echo / log しない。
  TOKEN_VALUE="${!TOKEN_ENV:-}"
  if [[ -z "$TOKEN_VALUE" ]]; then
    echo "[audit-correlation:live] env var ${TOKEN_ENV} is empty" >&2
    exit 2
  fi
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[audit-correlation:live] dry-run (no POST issued)"
    exit 0
  fi
  HTTP_CODE=$(curl -sS -o /dev/null -w '%{http_code}' \
    -X POST "$ENDPOINT" \
    -H "authorization: Bearer ${TOKEN_VALUE}" \
    -H "content-type: application/json" \
    --data '{}' || true)
  echo "[audit-correlation:live] http_code=${HTTP_CODE}"
  if [[ "$HTTP_CODE" == "200" ]]; then exit 0; fi
  exit 1
fi

if [[ -z "$GITHUB" || -z "$CLOUDFLARE" || -z "$SALT" ]]; then
  usage
fi

ARGS=(--github "$GITHUB" --cloudflare "$CLOUDFLARE" --salt "$SALT")
if [[ -n "$PREVIOUS_SALT" ]]; then
  ARGS+=(--previous-salt "$PREVIOUS_SALT")
fi
if [[ -n "$OUT" ]]; then
  ARGS+=(--out "$OUT")
fi

# Run via tsx (Node 24 / pnpm-managed). Salt は引数でしか渡さない (env / log に出さない)。
cd "$REPO_ROOT"
ERR_FILE="$(mktemp)"
if node --import tsx scripts/audit-correlation/runner.ts "${ARGS[@]}" 2>"$ERR_FILE"; then
  rm -f "$ERR_FILE"
  exit 0
fi

if grep -q 'Host version ".*" does not match binary version' "$ERR_FILE"; then
  cat "$ERR_FILE" >&2
  echo "[audit-correlation] local esbuild binary mismatch; retrying with pnpm dlx tsx@4.21.0" >&2
  rm -f "$ERR_FILE"
  exec pnpm dlx tsx@4.21.0 scripts/audit-correlation/runner.ts "${ARGS[@]}"
fi

cat "$ERR_FILE" >&2
rm -f "$ERR_FILE"
exit 1
