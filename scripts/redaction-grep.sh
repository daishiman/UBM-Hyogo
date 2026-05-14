#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"

patterns=(
  'hooks\.slack\.com/services/[A-Z0-9]'
  'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}'
  'xox[bp]-'
  'w[0-9]{10}-ek[0-9]{10}'
)

for pattern in "${patterns[@]}"; do
  if rg -n --hidden --no-ignore "$pattern" "$ROOT" \
    --glob '!**/.git/**' \
    --glob '!**/node_modules/**' \
    --glob '!**/.next/**' \
    --glob '!**/dist/**' \
    --glob '!**/coverage/**' \
    --glob '!scripts/notify/save-slack-evidence.ts' \
    --glob '!scripts/notify/__tests__/slack-incident-runbook.spec.ts' \
    --glob '!docs/30-workflows/completed-tasks/09c-incident-runbook-slack-delivery/outputs/phase-08/main.md' \
    --glob '!docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-09/main.md' >/dev/null; then
    echo "FAIL redaction pattern matched: $pattern" >&2
    exit 1
  fi
done

echo "OK: redaction grep 4 patterns, 0 hits"
