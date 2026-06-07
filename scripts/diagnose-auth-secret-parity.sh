#!/usr/bin/env bash
set -euo pipefail

JSON=0
if [[ "${1:-}" == "--json" ]]; then JSON=1; shift; fi
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "usage: bash scripts/diagnose-auth-secret-parity.sh [--json]"
  exit 0
fi
if [[ $# -ne 0 ]]; then
  echo "diagnose-auth-secret-parity: unknown argument: $1" >&2
  exit 64
fi

has_secret() {
  local config="$1"
  bash scripts/cf.sh secret list --config "$config" --env staging 2>/dev/null | grep -Fq "AUTH_SECRET"
}

web=missing
api=missing
if has_secret apps/web/wrangler.toml; then web=present; fi
if has_secret apps/api/wrangler.toml; then api=present; fi

base_status=ok
if grep -nE 'NEXT_PUBLIC_API_BASE_URL|PUBLIC_API_BASE_URL|INTERNAL_API_BASE_URL' apps/web/wrangler.toml | grep -E 'localhost|127\.0\.0\.1' >/dev/null; then
  base_status=localhost_present
fi

if [[ "$JSON" -eq 1 ]]; then
  printf '{"webAuthSecret":"%s","apiAuthSecret":"%s","webBaseUrl":"%s","note":"presence only; usability is proven by /api/me 200 smoke"}\n' "$web" "$api" "$base_status"
else
  printf 'web AUTH_SECRET: %s\napi AUTH_SECRET: %s\nweb base url: %s\n' "$web" "$api" "$base_status"
  echo "note: presence only; parity usability is proven by scripts/smoke-staging-me.sh"
fi

[[ "$web" == "present" && "$api" == "present" && "$base_status" == "ok" ]]
