#!/usr/bin/env bash
set -euo pipefail

TARGET="docs/00-getting-started-manual/specs/09c-primitives.md"

if [[ ! -f "$TARGET" ]]; then
  echo "FAIL missing target: $TARGET" >&2
  exit 1
fi

fail=0

check_zero() {
  local label="$1"
  local pattern="$2"
  local count
  count=$((rg -n "$pattern" "$TARGET" || true) | wc -l | tr -d ' ')
  echo "$label: $count"
  if [[ "$count" != "0" ]]; then
    fail=1
  fi
}

check_zero "HEX" '#[0-9A-Fa-f]{3,8}\b'
check_zero "oklch" 'oklch\('
check_zero "px" '[0-9]+(\.[0-9]+)?px\b'
check_zero "bgBracket" 'bg-\['
check_zero "placeholder-token-sized" 'token-sized'
check_zero "placeholder-09b-token-value" '09b-token-value'
check_zero "placeholder-token-mix" 'token-mix\('

numbered_headings=$(rg -n '^## [0-9]+\. ' "$TARGET" | wc -l | tr -d ' ')
section99=$(rg -n '^## 99\. 不採用 primitive$' "$TARGET" | wc -l | tr -d ' ')
jsx_blocks=$(rg -n '^```jsx$' "$TARGET" | wc -l | tr -d ' ')

echo "numbered_headings: $numbered_headings"
echo "section99: $section99"
echo "jsx_blocks: $jsx_blocks"

if (( numbered_headings < 18 )); then fail=1; fi
if [[ "$section99" != "1" ]]; then fail=1; fi
if (( jsx_blocks < 17 )); then fail=1; fi

for required in TweaksPanel "data-theme switcher" "AvatarStoreProvider#localStorage"; do
  if ! rg -q -F "$required" "$TARGET"; then
    echo "missing_required_99: $required"
    fail=1
  fi
done

if [[ "$fail" != "0" ]]; then
  echo "FAIL"
  exit 1
fi

echo "OK"
