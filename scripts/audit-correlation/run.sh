#!/usr/bin/env bash
# audit-correlation CLI runner
# Usage: scripts/audit-correlation/run.sh \
#   --github <github-fixture.json> \
#   --cloudflare <cloudflare-fixture.json> \
#   --salt <salt-string> \
#   [--out <output.json>]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

GITHUB=""
CLOUDFLARE=""
SALT=""
OUT=""

usage() {
  cat <<'EOF' >&2
Usage: run.sh --github <gh.json> --cloudflare <cf.json> --salt <salt> [--out <out.json>]
exit codes: 0=success, 1=correlation failure, 2=invalid args
EOF
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --github) GITHUB="${2:-}"; shift 2 ;;
    --cloudflare) CLOUDFLARE="${2:-}"; shift 2 ;;
    --salt) SALT="${2:-}"; shift 2 ;;
    --out) OUT="${2:-}"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "unknown arg: $1" >&2; usage ;;
  esac
done

if [[ -z "$GITHUB" || -z "$CLOUDFLARE" || -z "$SALT" ]]; then
  usage
fi

ARGS=(--github "$GITHUB" --cloudflare "$CLOUDFLARE" --salt "$SALT")
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
