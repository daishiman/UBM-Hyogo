#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT="$REPO_ROOT/scripts/redaction-check.sh"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

pass_count=0

assert_exit() {
  local expected="$1"
  shift
  set +e
  "$@" >"$TMP_DIR/out" 2>"$TMP_DIR/err"
  local actual="$?"
  set -e
  if [ "$actual" -ne "$expected" ]; then
    echo "expected exit $expected, got $actual: $*" >&2
    echo "--- stdout ---" >&2
    cat "$TMP_DIR/out" >&2
    echo "--- stderr ---" >&2
    cat "$TMP_DIR/err" >&2
    exit 1
  fi
  pass_count=$((pass_count + 1))
}

printf 'deploy complete\nno secret here\n' > "$TMP_DIR/clean.log"
assert_exit 0 bash "$SCRIPT" --log "$TMP_DIR/clean.log"

printf 'account abcdef1234567890 leaked\n' > "$TMP_DIR/account.log"
assert_exit 1 bash "$SCRIPT" --log "$TMP_DIR/account.log" --account-id abcdef1234567890

printf 'account zzzzzzzzzzzzzzzz leaked\n' > "$TMP_DIR/account-env.log"
assert_exit 1 env CLOUDFLARE_ACCOUNT_ID=zzzzzzzzzzzzzzzz bash "$SCRIPT" --log "$TMP_DIR/account-env.log"

printf 'token abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN leaked\n' > "$TMP_DIR/token-like.log"
assert_exit 1 bash "$SCRIPT" --log "$TMP_DIR/token-like.log"

printf 'token *** is masked\n' > "$TMP_DIR/masked.log"
assert_exit 0 bash "$SCRIPT" --log "$TMP_DIR/masked.log"

assert_exit 1 bash "$SCRIPT" --log "$TMP_DIR/missing.log"

assert_exit 0 bash "$SCRIPT" < /dev/null

assert_exit 2 bash "$SCRIPT" --unknown

printf 'CLOUDFLARE_API_TOKEN=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN\n' > "$TMP_DIR/env-token.log"
assert_exit 1 bash "$SCRIPT" --log "$TMP_DIR/env-token.log"

{
  printf 'line 1\n'
  printf 'first abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN\n'
  printf 'second 0123456789012345678901234567890123456789\n'
} > "$TMP_DIR/multiline.log"
assert_exit 1 bash "$SCRIPT" --log "$TMP_DIR/multiline.log"

printf 'sha256-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN is allowed\n' > "$TMP_DIR/hash.log"
assert_exit 0 bash "$SCRIPT" --log "$TMP_DIR/hash.log"

large_log="$TMP_DIR/large.log"
for i in $(seq 1 1000); do
  printf 'line %s clean\n' "$i"
done > "$large_log"
assert_exit 0 bash "$SCRIPT" --log "$large_log"

echo "redaction-check.test.sh: $pass_count assertions passed"
