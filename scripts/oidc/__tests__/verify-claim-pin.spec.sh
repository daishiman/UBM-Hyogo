#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT="$REPO_ROOT/scripts/oidc/verify-claim-pin.sh"
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

assert_exit 0 bash "$SCRIPT" --repository daishiman/UBM-Hyogo --ref refs/heads/main --environment production --event-name push
assert_exit 0 bash "$SCRIPT" --repository daishiman/UBM-Hyogo --ref refs/heads/dev --environment staging --event-name push
assert_exit 1 bash "$SCRIPT" --repository attacker/evil --ref refs/heads/main --environment production --event-name push
assert_exit 1 bash "$SCRIPT" --repository daishiman/UBM-Hyogo --ref refs/heads/feature/foo --environment production --event-name push
assert_exit 1 bash "$SCRIPT" --repository daishiman/UBM-Hyogo --ref refs/heads/main --environment development --event-name push
assert_exit 1 bash "$SCRIPT" --repository daishiman/UBM-Hyogo --ref refs/heads/main --environment production --event-name pull_request
assert_exit 2 bash "$SCRIPT" --repository daishiman/UBM-Hyogo
assert_exit 1 bash "$SCRIPT" --repository daishiman/UBM-Hyogo --ref refs/heads/dev --environment production --event-name push
assert_exit 2 bash "$SCRIPT" --repository daishiman/UBM-Hyogo --ref refs/heads/main --environment production --event-name push --unknown

echo "verify-claim-pin.spec.sh: $pass_count assertions passed"
