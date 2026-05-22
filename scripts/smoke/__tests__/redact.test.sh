#!/usr/bin/env bash
# T-1 redact.sh fixture test (issue-571 phase-04 §T-1)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REDACT="$SCRIPT_DIR/../redact.sh"

fail=0
total=0

assert_redacts() {
  local id="$1"
  local input="$2"
  local must_contain="$3"
  local must_not_contain="$4"
  total=$((total + 1))

  local out
  out="$(printf '%s\n' "$input" | bash "$REDACT")"

  if [[ -n "$must_contain" && "$out" != *"$must_contain"* ]]; then
    echo "FAIL [$id] expected to contain: $must_contain"
    echo "  got: $out"
    fail=$((fail + 1))
    return
  fi
  if [[ -n "$must_not_contain" && "$out" == *"$must_not_contain"* ]]; then
    echo "FAIL [$id] must not contain: $must_not_contain"
    echo "  got: $out"
    fail=$((fail + 1))
    return
  fi
  echo "PASS [$id]"
}

# F-1: Set-Cookie line redaction
assert_redacts "F-1a" "Set-Cookie: session=abcdef123" "Set-Cookie: [REDACTED]" "abcdef123"
# F-2: authorization Bearer redaction
assert_redacts "F-2a" "authorization: Bearer sample-token-xyz" "authorization: [REDACTED]" "sample-token-xyz"
assert_redacts "F-2b" "header: Bearer sample-token-xyz" "Bearer [REDACTED]" "sample-token-xyz"
# F-3: cf-_session token redaction
assert_redacts "F-3" "cf-_session=token123abc" "cf-_session=[REDACTED]" "token123abc"
# F-4: base64 encoded cookie value
# decoded plain text is "session=1234567890"; both encoded and decoded values must be absent.
assert_redacts "F-4a" "Set-Cookie: c2Vzc2lvbj0xMjM0NTY3ODkw" "Set-Cookie: [REDACTED]" "c2Vzc2lvbj0xMjM0NTY3ODkw"
assert_redacts "F-4b" "Cookie: c2Vzc2lvbj0xMjM0NTY3ODkw" "Cookie: [REDACTED]" "c2Vzc2lvbj0xMjM0NTY3ODkw"
assert_redacts "F-4c" "Cookie: c2Vzc2lvbj0xMjM0NTY3ODkw" "Cookie: [REDACTED]" "1234567890"
# F-5: 機微情報なし (変更なし)
assert_redacts "F-5" "status=200" "status=200" ""
# F-6: __Secure-authjs cookie value
assert_redacts "F-6" '"__Secure-authjs.session-token=abc.def.ghi"' "__Secure-authjs.session-token=[REDACTED]" "abc.def.ghi"
# F-7: sessionToken JSON
assert_redacts "F-7" '{"sessionToken": "secret-value-1"}' '[REDACTED]' "secret-value-1"

if [[ "$fail" -ne 0 ]]; then
  echo "FAIL: $fail/$total cases failed"
  exit 1
fi
echo "OK: all $total redact fixtures pass"
