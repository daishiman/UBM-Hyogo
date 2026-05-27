#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"

matches="$(
  rg -n 'style=\{' "$ROOT/apps/web/src" "$ROOT/apps/web/app" \
    -g '*.tsx' \
    -g '!opengraph-image.tsx' \
    -g '!**/opengraph-image/**' || true
)"

if [[ -n "$matches" ]]; then
  echo "verify-no-inline-style: FAIL: inline React style props are forbidden outside ImageResponse routes." >&2
  echo "$matches" >&2
  exit 1
fi

echo "verify-no-inline-style: OK"
