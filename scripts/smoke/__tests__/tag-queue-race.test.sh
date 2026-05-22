#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/../tag-queue-race.mjs"

fail=0
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

record_fail() {
  echo "FAIL [$1] $2"
  fail=$((fail + 1))
}

assert_json_value() {
  local id="$1"
  local json="$2"
  local expr="$3"
  local expected="$4"
  local actual
  actual="$(JSON_INPUT="$json" node -e "const data = JSON.parse(process.env.JSON_INPUT); console.log($expr);")"
  if [[ "$actual" != "$expected" ]]; then
    record_fail "$id" "expected $expected, got $actual"
  else
    echo "PASS [$id]"
  fi
}

dry_run_out="$(
  node "$RUNNER" --dry-run \
    --env staging \
    --queue-id q1 \
    --concurrency 3 \
    --base-url https://example.invalid \
    --session-cookie secret-cookie \
    --action confirmed \
    --tag-codes t1
)"
assert_json_value "dry-run queueId" "$dry_run_out" "data.queueId" "q1"
assert_json_value "dry-run redacts cookie" "$dry_run_out" "data.sessionCookie" "***"
if [[ "$dry_run_out" == *"secret-cookie"* ]]; then
  record_fail "dry-run leak" "session cookie appeared in stdout"
else
  echo "PASS [dry-run leak]"
fi

pass_results="$tmp_dir/pass.json"
printf '%s\n' '[{"status":200,"body":{"ok":true}},{"status":409,"body":{"ok":false,"error":"race_lost"}},{"status":409,"body":{"ok":false,"error":"race_lost"}}]' > "$pass_results"
pass_out="$(node "$RUNNER" --analyze-only --input "$pass_results")"
assert_json_value "analyze pass verdict" "$pass_out" "data.verdict" "pass"
assert_json_value "analyze pass successes" "$pass_out" "data.successes" "1"
assert_json_value "analyze pass raceLosts" "$pass_out" "data.raceLosts" "2"

side_effect_pass="$tmp_dir/side-effect-pass.json"
printf '%s\n' '{"expected":{"memberTagsDelta":1,"auditLogDelta":1,"queueStatus":"resolved"},"actual":{"memberTagsDelta":1,"auditLogDelta":1,"queueStatus":"resolved"}}' > "$side_effect_pass"
side_effect_pass_out="$(node "$RUNNER" --analyze-only --input "$pass_results" --side-effect-input "$side_effect_pass")"
assert_json_value "side-effect pass verdict" "$side_effect_pass_out" "data.verdict" "pass"
assert_json_value "side-effect pass checked" "$side_effect_pass_out" "data.sideEffects.checked" "true"

side_effect_fail="$tmp_dir/side-effect-fail.json"
printf '%s\n' '{"expected":{"memberTagsDelta":1,"auditLogDelta":1,"queueStatus":"resolved"},"actual":{"memberTagsDelta":2,"auditLogDelta":1,"queueStatus":"resolved"}}' > "$side_effect_fail"
set +e
side_effect_fail_out="$(node "$RUNNER" --analyze-only --input "$pass_results" --side-effect-input "$side_effect_fail")"
side_effect_fail_ec=$?
set -e
if [[ "$side_effect_fail_ec" -ne 1 ]]; then
  record_fail "side-effect fail exit" "expected 1, got $side_effect_fail_ec"
else
  echo "PASS [side-effect fail exit]"
fi
assert_json_value "side-effect fail verdict" "$side_effect_fail_out" "data.verdict" "fail"

multi_success="$tmp_dir/multi-success.json"
printf '%s\n' '[{"status":200,"body":{"ok":true}},{"status":200,"body":{"ok":true}},{"status":409,"body":{"ok":false,"error":"race_lost"}}]' > "$multi_success"
set +e
multi_out="$(node "$RUNNER" --analyze-only --input "$multi_success")"
multi_ec=$?
set -e
if [[ "$multi_ec" -ne 1 ]]; then
  record_fail "analyze multi-success exit" "expected 1, got $multi_ec"
else
  echo "PASS [analyze multi-success exit]"
fi
assert_json_value "analyze multi-success verdict" "$multi_out" "data.verdict" "fail"

no_success="$tmp_dir/no-success.json"
printf '%s\n' '[{"status":409,"body":{"ok":false,"error":"race_lost"}},{"status":409,"body":{"ok":false,"error":"race_lost"}},{"status":409,"body":{"ok":false,"error":"race_lost"}}]' > "$no_success"
set +e
no_success_out="$(node "$RUNNER" --analyze-only --input "$no_success")"
no_success_ec=$?
set -e
if [[ "$no_success_ec" -ne 1 ]]; then
  record_fail "analyze no-success exit" "expected 1, got $no_success_ec"
else
  echo "PASS [analyze no-success exit]"
fi
assert_json_value "analyze no-success verdict" "$no_success_out" "data.verdict" "fail"

set +e
concurrency_stdout="$(
  node "$RUNNER" \
    --env local \
    --queue-id q1 \
    --concurrency 1 \
    --base-url http://127.0.0.1:1 \
    --session-cookie secret-cookie \
    --action confirmed \
    --tag-codes t1 2>/dev/null
)"
concurrency_ec=$?
set -e
if [[ "$concurrency_ec" -ne 2 ]]; then
  record_fail "concurrency<2 exit" "expected 2, got $concurrency_ec; stdout=$concurrency_stdout"
else
  echo "PASS [concurrency<2 exit]"
fi

set +e
node "$RUNNER" --env staging --queue-id q1 --base-url https://example.invalid --session-cookie c --action confirmed >/dev/null 2>&1
missing_ec=$?
set -e
if [[ "$missing_ec" -ne 2 ]]; then
  record_fail "missing tag-codes exit" "expected 2, got $missing_ec"
else
  echo "PASS [missing tag-codes exit]"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "FAIL: $fail cases"
  exit 1
fi

echo "OK: tag-queue-race smoke tests pass"
