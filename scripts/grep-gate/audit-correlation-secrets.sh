#!/usr/bin/env bash
# audit-correlation secrets grep gate.
# Verifies that AUDIT_CORRELATION_SALT* literals do not leak into build artifacts
# or worker output paths during dual-hash rotation.
# Usage: scripts/grep-gate/audit-correlation-secrets.sh [<extra-path>...]
# exit 0 = clean, 1 = literal detected, 2 = bad args
set -euo pipefail

SCAN_PATHS=(
  "apps/api/dist"
  "apps/api/.wrangler"
  "apps/api/src/audit-correlation"
)
if [[ $# -gt 0 ]]; then
  SCAN_PATHS+=("$@")
fi

DETECTED=0

for p in "${SCAN_PATHS[@]}"; do
  [[ -e "$p" ]] || continue
  # 1) Hard-coded 64-hex literals next to AUDIT_CORRELATION_SALT context
  if grep -RE -n -A2 -B2 "AUDIT_CORRELATION_SALT(_PREVIOUS)?" "$p" 2>/dev/null \
      | grep -E '"[a-f0-9]{32,}"' >/dev/null 2>&1; then
    echo "DETECTED: hex-like salt literal near AUDIT_CORRELATION_SALT in $p" >&2
    DETECTED=1
  fi
  # 2) Direct assignment of salt literal: AUDIT_CORRELATION_SALT="<value>" (any non-op:// value)
  if grep -RE -n 'AUDIT_CORRELATION_SALT(_PREVIOUS)?\s*=\s*"[^o][^p]' "$p" 2>/dev/null \
      | grep -v -E '\.example|\.md|\.test\.ts|\.test\.tsx' >/dev/null 2>&1; then
    echo "DETECTED: literal assignment to AUDIT_CORRELATION_SALT in $p" >&2
    DETECTED=1
  fi
done

if [[ "$DETECTED" -eq 1 ]]; then
  exit 1
fi
echo "audit-correlation-secrets grep-gate clean (paths: ${SCAN_PATHS[*]})"
exit 0
