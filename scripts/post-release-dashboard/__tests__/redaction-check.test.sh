#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$TMP_DIR/pass" "$TMP_DIR/fail"
printf '{"ok":true}\n' > "$TMP_DIR/pass/dashboard.json"
printf 'Authorization: Bearer sample\n' > "$TMP_DIR/fail/dashboard.md"

bash "$SCRIPT_DIR/../lib/redaction-check.sh" "$TMP_DIR/pass" >/dev/null
if bash "$SCRIPT_DIR/../lib/redaction-check.sh" "$TMP_DIR/fail" >/dev/null 2>&1; then
  echo "redaction check should fail on sensitive markers" >&2
  exit 1
fi
