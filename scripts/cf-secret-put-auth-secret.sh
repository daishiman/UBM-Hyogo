#!/usr/bin/env bash
set -euo pipefail

CHECK=0
SOURCE="-"
TARGETS=(web api)

usage() {
  cat <<'USAGE'
usage: bash scripts/cf-secret-put-auth-secret.sh [--check] [--from-op op://Vault/Item/Field] [--web-only|--api-only]

Reads AUTH_SECRET from stdin by default. Values are never printed.
Without --check, writes the same secret to selected staging workers via scripts/cf.sh.

exit codes: 0=success/check passed, 1=secret put failed, 2=secret shorter than 32 chars,
64=usage, 78=empty input/op read failed
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK=1; shift ;;
    --from-op) SOURCE="${2:?--from-op requires an op:// reference}"; shift 2 ;;
    --web-only) TARGETS=(web); shift ;;
    --api-only) TARGETS=(api); shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "cf-secret-put-auth-secret: unknown argument: $1" >&2; usage >&2; exit 64 ;;
  esac
done

if [[ "$SOURCE" == op://* ]]; then
  if ! secret="$(op read "$SOURCE")"; then
    echo "cf-secret-put-auth-secret: failed to read secret reference" >&2
    exit 78
  fi
else
  secret="$(cat)"
fi

if [[ -z "$secret" ]]; then
  echo "cf-secret-put-auth-secret: AUTH_SECRET input is empty" >&2
  exit 78
fi

if (( ${#secret} < 32 )); then
  echo "cf-secret-put-auth-secret: AUTH_SECRET must be at least 32 characters" >&2
  exit 2
fi

if [[ "$CHECK" -eq 1 ]]; then
  echo "cf-secret-put-auth-secret: check passed"
  exit 0
fi

for target in "${TARGETS[@]}"; do
  case "$target" in
    web) config="apps/web/wrangler.toml" ;;
    api) config="apps/api/wrangler.toml" ;;
    *) exit 64 ;;
  esac
  if ! printf '%s' "$secret" | bash scripts/cf.sh secret put AUTH_SECRET --config "$config" --env staging; then
    echo "cf-secret-put-auth-secret: failed to update $target staging worker" >&2
    exit 1
  fi
done

echo "cf-secret-put-auth-secret: updated selected staging workers"
