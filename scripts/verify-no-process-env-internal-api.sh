#!/usr/bin/env bash
set -euo pipefail

if rg -n "process\.env(?:\.INTERNAL_API_BASE_URL|\[['\"]INTERNAL_API_BASE_URL['\"]\])" \
  apps/web/src apps/web/app \
  --glob '!**/*.spec.ts' \
  --glob '!**/*.spec.tsx' \
  --glob '!**/*.test.ts' \
  --glob '!**/*.test.tsx' \
  2>/dev/null; then
  echo "::error::process.env.INTERNAL_API_BASE_URL direct access detected; use apps/web/src/lib/env.ts accessors instead" >&2
  exit 1
fi

echo "ok: no direct process.env.INTERNAL_API_BASE_URL references"
