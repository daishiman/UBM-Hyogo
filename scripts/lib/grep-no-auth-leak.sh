#!/usr/bin/env bash
set -euo pipefail

# Authenticated staging visual runs mint short-lived session cookies. This gate
# fails if a tracked file contains a concrete JWT, cookie assignment, or staging
# auth secret assignment. Cookie/env variable names without values are allowed.

hits=0

scan_tracked() {
  local pattern="$1"
  git ls-files -z | xargs -0 grep -HInE "$pattern" 2>/dev/null || true
}

jwt_hits="$(scan_tracked 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}')"
if [[ -n "$jwt_hits" ]]; then
  printf '%s\n' "$jwt_hits"
  hits=$((hits + 1))
fi

cookie_hits="$(scan_tracked 'authjs\.session-token=[A-Za-z0-9_.-]{20,}')"
if [[ -n "$cookie_hits" ]]; then
  printf '%s\n' "$cookie_hits"
  hits=$((hits + 1))
fi

secret_hits="$(scan_tracked 'STAGING_AUTH_SECRET=[A-Za-z0-9_+=/@.-]{16,}')"
if [[ -n "$secret_hits" ]]; then
  printf '%s\n' "$secret_hits"
  hits=$((hits + 1))
fi

if [[ "$hits" -ne 0 ]]; then
  echo "FAIL: auth leak detected"
  exit 1
fi

echo "OK: no auth leak"
