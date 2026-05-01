#!/usr/bin/env bash
# tests/unit/redaction.test.sh — UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001
# scripts/lib/redaction.sh の R-01〜R-06 unit test。
# 実 token / 実 secret は記載しない (合成サンプルのみ)。

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=../../scripts/lib/redaction.sh
. "$REPO_ROOT/scripts/lib/redaction.sh"

PASS=0
FAIL=0

assert_redacted() {
  local name="$1" input="$2" must_not_contain="$3"
  local actual
  actual="$(printf '%s' "$input" | redact_stream)"
  if printf '%s' "$actual" | grep -qE "$must_not_contain"; then
    printf 'FAIL %s: redaction did not remove pattern %s\n  input:  %s\n  output: %s\n' \
      "$name" "$must_not_contain" "$input" "$actual" >&2
    FAIL=$((FAIL+1))
  else
    printf 'PASS %s\n' "$name"
    PASS=$((PASS+1))
  fi
}

assert_contains() {
  local name="$1" input="$2" must_contain="$3"
  local actual
  actual="$(printf '%s' "$input" | redact_stream)"
  if printf '%s' "$actual" | grep -qE "$must_contain"; then
    printf 'PASS %s\n' "$name"
    PASS=$((PASS+1))
  else
    printf 'FAIL %s: expected pattern %s not found\n  output: %s\n' \
      "$name" "$must_contain" "$actual" >&2
    FAIL=$((FAIL+1))
  fi
}

# R-01 generic long token
assert_redacted "R-01 long token" \
  "token=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop1234567890" \
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop1234567890"

# R-02 Bearer
assert_redacted "R-02 Bearer header" \
  "Authorization: Bearer mock_bearer_token_xyz" \
  "mock_bearer_token_xyz"
assert_contains "R-02 leaves marker" \
  "Authorization: Bearer mock_bearer_token_xyz" \
  "REDACTED_AUTH"

# R-03 URL query
assert_redacted "R-03 URL query" \
  "sink=https://s3.amazonaws.com/bucket?X-Amz-Signature=AKIAFAKE&exp=123" \
  "X-Amz-Signature=AKIAFAKE"
assert_contains "R-03 keeps host" \
  "sink=https://s3.amazonaws.com/bucket?X-Amz-Signature=AKIAFAKE&exp=123" \
  "s3.amazonaws.com"

# R-04 AWS access key
assert_redacted "R-04 AKIA key" \
  "access_key_id=AKIAEXAMPLEFAKEKEY00" \
  "AKIAEXAMPLEFAKEKEY00"

# R-05 dataset_credential
assert_redacted "R-05 dataset_credential" \
  "dataset_credential=mock_secret_value" \
  "mock_secret_value"

# R-06 OAuth ya29
assert_redacted "R-06 ya29 oauth" \
  "token: ya29.MOCK_OAUTH_VALUE_xxxxxxxxxxxxxxxxxx" \
  "ya29\\.MOCK_OAUTH_VALUE"
assert_contains "R-06 leaves marker" \
  "token: ya29.MOCK_OAUTH_VALUE_xxxxxxxxxxxxxxxxxx" \
  "REDACTED_OAUTH"

# 偽陽性回避: short string (< 40 chars) は R-01 で潰さない
assert_contains "no false positive on short tokens" \
  "name=ubm-hyogo-web-production" \
  "ubm-hyogo-web-production"

# Unicode 維持
assert_contains "preserve japanese" \
  "トークン: ya29.FAKE_OAUTH_TOKEN_XXXXXXXXXXX 確認" \
  "トークン"

printf '\n--- summary: PASS=%d FAIL=%d ---\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
