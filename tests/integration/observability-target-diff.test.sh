#!/usr/bin/env bash
# tests/integration/observability-target-diff.test.sh
# UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001
# script の CLI 契約と redaction 不変条件を統合的に検証する。
# 実 cf.sh / 実 Cloudflare API には到達しない (default で OBS_DIFF_FETCH_LOGPUSH 未設定)。

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$REPO_ROOT/scripts/observability-target-diff.sh"
PASS=0
FAIL=0

run_diff() {
  bash "$SCRIPT" --current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web --config "$REPO_ROOT/apps/web/wrangler.toml" "$@"
}

assert_exit() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    printf 'PASS %s (exit=%s)\n' "$name" "$actual"
    PASS=$((PASS+1))
  else
    printf 'FAIL %s: expected exit=%s got=%s\n' "$name" "$expected" "$actual" >&2
    FAIL=$((FAIL+1))
  fi
}

assert_contains_pattern() {
  local name="$1" output="$2" pattern="$3"
  if printf '%s' "$output" | grep -qE "$pattern"; then
    printf 'PASS %s\n' "$name"
    PASS=$((PASS+1))
  else
    printf 'FAIL %s: pattern %s not found\n  output: %s\n' "$name" "$pattern" "$output" >&2
    FAIL=$((FAIL+1))
  fi
}

assert_no_pattern() {
  local name="$1" output="$2" pattern="$3"
  if printf '%s' "$output" | grep -qE "$pattern"; then
    printf 'FAIL %s: forbidden pattern %s found\n  output: %s\n' "$name" "$pattern" "$output" >&2
    FAIL=$((FAIL+1))
  else
    printf 'PASS %s (no %s)\n' "$name" "$pattern"
    PASS=$((PASS+1))
  fi
}

# TC-01 / smoke: default invocation
out="$(run_diff 2>/dev/null || true)"
rc=$?
# script 出力に Worker 名と 4 軸セクションが揃う
assert_contains_pattern "TC-01: contains R1 Workers Logs"   "$out" "## R1 Workers Logs"
assert_contains_pattern "TC-01: contains R2 Tail"           "$out" "## R2 Tail"
assert_contains_pattern "TC-01: contains R3 Logpush"        "$out" "## R3 Logpush"
assert_contains_pattern "TC-01: contains R4 Analytics"      "$out" "## R4 Analytics Engine"
assert_contains_pattern "TC-01: includes current worker"    "$out" "ubm-hyogo-web-production"
assert_contains_pattern "TC-01: includes legacy worker"     "$out" "ubm-hyogo-web"
assert_contains_pattern "TC-01: includes Diff summary"      "$out" "Diff summary"

# AC-2 redaction unchanged output: token-like patterns must not appear
assert_no_pattern "TC-01: no Bearer left in output"         "$out" "Bearer [A-Za-z]"
assert_no_pattern "TC-01: no AKIA in output"                "$out" "AKIA[0-9A-Z]{16}"
assert_no_pattern "TC-01: no ya29 in output"                "$out" "ya29\\."

# TC-12 / argument validation
set +e
bash "$SCRIPT" >/dev/null 2>&1
rc=$?
set -e
assert_exit "TC-12: missing args -> exit 64" "64" "$rc"

set +e
bash "$SCRIPT" --current-worker x --legacy-worker y --format invalid >/dev/null 2>&1
rc=$?
set -e
assert_exit "TC-12: invalid format -> exit 64" "64" "$rc"

# TC-08 / wrangler 直叩き grep (script 内に wrangler 呼び出しが無いこと)
if grep -nE '^\s*(wrangler|npx wrangler)\b' "$SCRIPT"; then
  printf 'FAIL TC-08: wrangler direct invocation found in script\n' >&2
  FAIL=$((FAIL+1))
else
  printf 'PASS TC-08: no direct wrangler invocation\n'
  PASS=$((PASS+1))
fi

# AC-3 / GET only: POST/PUT/DELETE/PATCH 文字列が curl 等で使われていないこと
if grep -nE '\b(POST|PUT|DELETE|PATCH)\b' "$SCRIPT" | grep -vE '^[0-9]+:[[:space:]]*#'; then
  printf 'FAIL AC-3: mutation HTTP method literal found in script\n' >&2
  FAIL=$((FAIL+1))
else
  printf 'PASS AC-3: GET only (no mutation method literal)\n'
  PASS=$((PASS+1))
fi

# TC-05 / TC-06 redaction contract: pipe a token-laden fixture through redact_stream
. "$REPO_ROOT/scripts/lib/redaction.sh"
fixture_out="$(redact_stream < "$REPO_ROOT/tests/fixtures/observability/sink-url-with-query.txt")"
assert_no_pattern "TC-05: AKIA stripped"        "$fixture_out" "AKIA[0-9A-Z]{16}"
assert_no_pattern "TC-05: ya29 stripped"        "$fixture_out" "ya29\\.[A-Za-z0-9_-]{8,}"
assert_no_pattern "TC-05: Bearer value stripped" "$fixture_out" "Bearer mock_token"
assert_no_pattern "TC-06: dataset_credential value stripped" "$fixture_out" "dataset_credential=mock_secret"

printf '\n--- summary: PASS=%d FAIL=%d ---\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
