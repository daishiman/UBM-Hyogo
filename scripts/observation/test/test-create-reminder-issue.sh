#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$ROOT/create-reminder-issue.sh"
PASS=0
FAIL=0

assert_grep() {
  local file="$1" pattern="$2" name="$3"
  if grep -qE "$pattern" "$file"; then
    PASS=$((PASS + 1))
    echo "PASS: $name"
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: $name (pattern=$pattern)"
    cat "$file"
  fi
}

run_resolve() {
  local out
  out="$(mktemp)"
  GITHUB_OUTPUT="$out" \
    INPUT_RELEASE_DATE="${1:-}" \
    INPUT_OFFSET_DAYS="${2:-}" \
    TODAY_OVERRIDE="${3:-}" \
    bash "$SCRIPT" --resolve-only >/dev/null
  cat "$out"
  rm -f "$out"
}

run_resolve_with_fake_gh() {
  local out fake_bin
  out="$(mktemp)"
  fake_bin="$(mktemp -d)"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'if [ "$1" = "api" ] && [ "$2" = "repos/daishiman/UBM-Hyogo/releases/latest" ]; then' \
    '  echo "{\"published_at\":\"2026-05-01T00:00:00Z\"}"' \
    '  exit 0' \
    'fi' \
    'exit 1' >"$fake_bin/gh"
  chmod +x "$fake_bin/gh"
  PATH="$fake_bin:$PATH" GITHUB_OUTPUT="$out" TODAY_OVERRIDE="${1:-}" bash "$SCRIPT" --resolve-only >/dev/null
  cat "$out"
  rm -f "$out" "$fake_bin/gh"
  rmdir "$fake_bin"
}

out="$(mktemp)"
run_resolve 2026-05-01 "" 2026-05-05 >"$out"
assert_grep "$out" "should_remind=false" "TC-03 normal day"

out="$(mktemp)"
run_resolve 2026-05-01 "" 2026-05-08 >"$out"
assert_grep "$out" "should_remind=true" "TC-04 D+7 trigger"
assert_grep "$out" "offset=7" "TC-04 offset=7"

out="$(mktemp)"
run_resolve 2026-05-01 "" 2026-05-31 >"$out"
assert_grep "$out" "should_remind=true" "TC-05 D+30 trigger"
assert_grep "$out" "offset=30" "TC-05 offset=30"

out="$(mktemp)"
run_resolve 2026-05-01 7 2026-06-15 >"$out"
assert_grep "$out" "should_remind=true" "TC-06 dispatch override"
assert_grep "$out" "offset=7" "TC-06 dispatch override offset"
assert_grep "$out" "target_date=2026-05-08" "TC-06 dispatch override target date"

out="$(mktemp)"
run_resolve 2026-05-01 15 2026-05-08 >"$out"
assert_grep "$out" "should_remind=false" "TC-07 invalid offset"

out="$(mktemp)"
run_resolve_with_fake_gh 2026-05-08 >"$out"
assert_grep "$out" "should_remind=true" "TC-07b latest release fallback"
assert_grep "$out" "release_date=2026-05-01" "TC-07b latest release date"

rendered="$(mktemp)"
RELEASE_DATE=2026-05-01 OFFSET=7 TARGET_DATE=2026-05-08 bash "$SCRIPT" --dry-run >"$rendered"
if grep -q '{{' "$rendered"; then
  FAIL=$((FAIL + 1))
  echo "FAIL: TC-08 unrendered placeholder"
  cat "$rendered"
else
  PASS=$((PASS + 1))
  echo "PASS: TC-08 placeholders all replaced"
fi
assert_grep "$rendered" "\\[D\\+7 observation\\] post-release 2026-05-01" "TC-08 title rendered"

rm -f "$out" "$rendered"

echo "----- result: PASS=$PASS FAIL=$FAIL -----"
[ "$FAIL" -eq 0 ]
