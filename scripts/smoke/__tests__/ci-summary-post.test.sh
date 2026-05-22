#!/usr/bin/env bash
# T-5 ci-summary-post.sh --dry-run / SLACK_WEBHOOK_INCIDENT 未設定時の post 抑制
# (issue-571 phase-04 §T-5)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POSTER="$SCRIPT_DIR/../ci-summary-post.sh"

fail=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cat > "$TMP/summary.json" <<'JSON'
{
  "status": "FAIL",
  "routes": [
    {"label":"admin-list","status":"FAIL","http":"500","contract":".members | type == \"array\""},
    {"label":"me-root","status":"PASS","http":"200","summary":"string"}
  ]
}
JSON

# --- T-5-1: --dry-run 時、Slack post せず stdout に message を出す ---
unset SLACK_WEBHOOK_INCIDENT || true
out="$(bash "$POSTER" "$TMP" --dry-run 2>&1)"
if [[ "$out" != *"runtime-smoke FAIL"* ]]; then
  echo "FAIL [T-5-1] missing message header. got: $out"
  fail=$((fail + 1))
else
  echo "PASS [T-5-1] dry-run prints message"
fi
if [[ "$out" != *"admin-list:FAIL/500"* ]]; then
  echo "FAIL [T-5-1] missing route summary. got: $out"
  fail=$((fail + 1))
fi

# --- T-5-2: SLACK_WEBHOOK_INCIDENT 未設定時、--dry-run なしでも post せずに stdout 出力 ---
unset SLACK_WEBHOOK_INCIDENT || true
out2="$(bash "$POSTER" "$TMP" 2>&1)"
if [[ "$out2" != *"runtime-smoke FAIL"* ]]; then
  echo "FAIL [T-5-2] no webhook should print message"
  fail=$((fail + 1))
else
  echo "PASS [T-5-2] no webhook -> stdout fallback"
fi

# --- T-5-3: summary.json 不在は exit 1 ---
EMPTY="$(mktemp -d)"
set +e
bash "$POSTER" "$EMPTY" --dry-run >/dev/null 2>&1
ec=$?
set -e
rm -rf "$EMPTY"
if [[ "$ec" -ne 1 ]]; then
  echo "FAIL [T-5-3] missing summary.json should exit 1, got $ec"
  fail=$((fail + 1))
else
  echo "PASS [T-5-3] missing summary -> exit 1"
fi

# --- T-5-4: redact filter が message に適用されている事 (Bearer 含む値が漏れない) ---
cat > "$TMP/summary.json" <<'JSON'
{
  "status": "FAIL",
  "routes": [
    {"label":"admin-list","status":"FAIL","http":"500","summary":"Bearer leakytokenvalue123"}
  ]
}
JSON
out3="$(bash "$POSTER" "$TMP" --dry-run 2>&1)"
if [[ "$out3" == *"leakytokenvalue123"* ]]; then
  echo "FAIL [T-5-4] redact failed: token leaked in: $out3"
  fail=$((fail + 1))
else
  echo "PASS [T-5-4] Bearer token redacted from message"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "FAIL: $fail cases"
  exit 1
fi
echo "OK: ci-summary-post tests pass"
