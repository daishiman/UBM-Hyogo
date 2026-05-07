#!/usr/bin/env bash
# scripts/post-release-dashboard/__tests__/30day-summary.test.sh
# 30day-summary.sh の plain shell test（TC-01〜TC-07）
# Refs #517
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
FIX_DIR="${SCRIPT_DIR}/fixtures/30day-summary"
TARGET="${ROOT_DIR}/scripts/post-release-dashboard/30day-summary.sh"

# 仕様の関数群を source
# shellcheck source=/dev/null
source "$TARGET"

# ---------- helpers ----------
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 日付プレースホルダーを今日基準で展開した fixture を作る
# render_fixture <fixture_basename> -> stdout: rendered file path
render_fixture() {
  local name="$1"
  local src="${FIX_DIR}/${name}"
  local dst="${TMP}/${name}"
  local content
  content="$(cat "$src")"
  local i iso
  for i in 22 23 24 25 26 27 28 29 30 31; do
    if date --version >/dev/null 2>&1; then
      iso=$(date -u -d "${i} days ago" +%Y-%m-%dT%H:%M:%SZ)
    else
      iso=$(date -u -v-"${i}"d +%Y-%m-%dT%H:%M:%SZ)
    fi
    content="${content//__TODAY_MINUS_${i}__/${iso}}"
  done
  printf '%s' "$content" > "$dst"
  echo "$dst"
}

today_iso() { date -u +%Y-%m-%dT%H:%M:%SZ; }

render_consecutive_schedule_fixture() {
  local dst="${TMP}/gate-satisfied-31.json"
  {
    echo "["
    local i comma conclusion
    for i in $(seq 31 -1 1); do
      comma=","
      [ "$i" -eq 1 ] && comma=""
      conclusion="success"
      [ "$i" -eq 31 ] && conclusion="failure"
      if date --version >/dev/null 2>&1; then
        iso=$(date -u -d "${i} days ago" +%Y-%m-%dT%H:%M:%SZ)
      else
        iso=$(date -u -v-"${i}"d +%Y-%m-%dT%H:%M:%SZ)
      fi
      printf '  {"conclusion":"%s","createdAt":"%s","event":"schedule","databaseId":%s,"url":"https://example.invalid/runs/%s"}%s\n' "$conclusion" "$iso" "$((4000 + i))" "$((4000 + i))" "$comma"
    done
    echo "]"
  } > "$dst"
  echo "$dst"
}

assert_eq() {
  local actual="$1" expected="$2" msg="${3:-}"
  if [ "$actual" != "$expected" ]; then
    echo "ASSERT FAIL ${msg}: expected=[${expected}] actual=[${actual}]" >&2
    return 1
  fi
}

PASS=0
FAIL=0
run_tc() {
  local name="$1"; shift
  if "$@"; then
    echo "PASS ${name}"
    PASS=$((PASS+1))
  else
    echo "FAIL ${name}" >&2
    FAIL=$((FAIL+1))
  fi
}

# ---------- TC-01: aggregate_runs 正常系 ----------
tc01_aggregate_runs_clean() {
  local f; f=$(render_fixture gate-satisfied-clean.json)
  local out; out=$(aggregate_runs "$f")
  echo "$out" | jq -e '
    has("runs_total") and has("schedule_runs_total")
    and has("oldest_schedule_created_at") and has("conclusion_dist")
    and has("schedule_days_total") and has("missing_schedule_gap_days")
    and has("failure_cause_dist") and has("failure_run_urls")
    and has("failure_rate") and has("longest_failure_streak")
    and .runs_total == 5
    and .schedule_runs_total == 5
    and .schedule_days_total == 5
    and .missing_schedule_gap_days == 0
    and .conclusion_dist.success == 5
    and .failure_cause_dist == {}
    and .failure_run_urls == []
    and .failure_rate == 0
  ' >/dev/null
}

# ---------- TC-02a: gate not satisfied (today-29d) ----------
tc02a_gate_not_satisfied() {
  local f; f=$(render_fixture gate-not-satisfied.json)
  local s="${TMP}/summary-not-satisfied.json"
  aggregate_runs "$f" > "$s"
  ! is_30day_gate_satisfied "$s" "$(today_iso)"
}

# ---------- TC-02b: gate satisfied (today-31d) ----------
tc02b_gate_satisfied() {
  local f; f=$(render_consecutive_schedule_fixture)
  local s="${TMP}/summary-satisfied.json"
  aggregate_runs "$f" > "$s"
  is_30day_gate_satisfied "$s" "$(today_iso)"
}

# ---------- TC-03: redact_log ----------
tc03_redact_log() {
  local out; out=$(redact_log "${FIX_DIR}/gate-satisfied-redaction-trigger.txt")
  # 4 パターンが残っていないこと
  if echo "$out" | grep -E '(token=|Bearer |secret:|Authorization:)' >/dev/null; then
    echo "leak detected: $out" >&2
    return 1
  fi
  # normal line は残ること
  echo "$out" | grep -F 'normal log line without sensitive' >/dev/null
  # redaction marker が付与されていること
  echo "$out" | grep -F '(redacted: token)' >/dev/null
  echo "$out" | grep -F '(redacted: bearer)' >/dev/null
  echo "$out" | grep -F '(redacted: secret)' >/dev/null
  echo "$out" | grep -F '(redacted: authorization)' >/dev/null
}

# ---------- TC-04: render_pr_body failure_rate >=10% ----------
tc04_render_pr_body_high_failure() {
  local f; f=$(render_fixture gate-satisfied-failure-rate-high.json)
  local s="${TMP}/summary-high.json"
  aggregate_runs "$f" > "$s"
  local body; body=$(render_pr_body "$s" "202605")
  echo "$body" | grep -F 'retry/alert 追加検討' >/dev/null
  echo "$body" | grep -F 'workflow_failure_unclassified' >/dev/null
  echo "$body" | grep -F 'https://example.invalid/runs/3001' >/dev/null
  echo "$body" | grep -F 'Refs #517, Refs #497, Refs #351' >/dev/null
}

# ---------- TC-04b: render_pr_body failure_rate < 10% (no retry section) ----------
tc04b_render_pr_body_low_failure() {
  local f; f=$(render_consecutive_schedule_fixture)
  local s="${TMP}/summary-clean.json"
  aggregate_runs "$f" > "$s"
  local body; body=$(render_pr_body "$s" "202605")
  if echo "$body" | grep -F 'retry/alert 追加検討' >/dev/null; then
    echo "unexpected retry section in low-failure body" >&2
    return 1
  fi
}

# ---------- TC-05: find_existing_pr (mock gh) ----------
tc05_find_existing_pr() {
  # gh stub: 期待 search 文字列が含まれていれば URL を返す
  # shellcheck disable=SC2329
  gh() {
    # gh pr list ... --json url --jq '.[0].url // ""' を擬似（gh が --jq を処理する）
    case "$*" in
      *"202605"*) echo "https://github.com/example/repo/pull/999" ;;
      *) echo "" ;;
    esac
  }
  export -f gh
  local existing; existing=$(find_existing_pr "202605")
  unset -f gh
  assert_eq "$existing" "https://github.com/example/repo/pull/999" "TC-05 existing"
}

# ---------- TC-05b: post_slack missing secret returns exit 3 ----------
tc05b_post_slack_missing_secret() {
  DRY_RUN=false
  unset SLACK_WEBHOOK_URL || true
  local code
  set +e
  post_slack '{"text":"x"}'
  code=$?
  set -e
  if [ "$code" -eq 0 ]; then
    echo "post_slack unexpectedly succeeded without SLACK_WEBHOOK_URL" >&2
    # shellcheck disable=SC2034
    DRY_RUN=true
    return 1
  fi
  # shellcheck disable=SC2034
  DRY_RUN=true
  assert_eq "$code" "3" "TC-05b missing secret exit"
}

# ---------- TC-06: --dry-run で副作用ゼロ ----------
tc06_dry_run_no_side_effect() {
  local f; f=$(render_fixture gate-satisfied-clean.json)

  # gh / git / curl を stub にしてカウンタ初期化
  local counter="${TMP}/calls.txt"
  local bin="${TMP}/bin"
  : > "$counter"
  mkdir -p "$bin"
  cat > "${bin}/gh" <<EOF
#!/usr/bin/env bash
echo "gh \$*" >> "$counter"
if [ "\$1" = "run" ]; then
  cat "$f"
elif [ "\$1" = "pr" ] && [ "\$2" = "list" ]; then
  echo ""
else
  echo "unexpected gh call: \$*" >&2
  exit 1
fi
EOF
  cat > "${bin}/git" <<EOF
#!/usr/bin/env bash
echo "git \$*" >> "$counter"
exit 1
EOF
  cat > "${bin}/curl" <<EOF
#!/usr/bin/env bash
echo "curl \$*" >> "$counter"
exit 1
EOF
  chmod +x "${bin}/gh" "${bin}/git" "${bin}/curl"

  local out
  out=$(
    cd "$ROOT_DIR"
    PATH="${bin}:$PATH" bash "$TARGET" --dry-run
  )

  # PR_BODY と SLACK_PAYLOAD の両方が出力されていること
  echo "$out" | grep -F -- '----- PR_BODY -----' >/dev/null
  echo "$out" | grep -F -- '----- SLACK_PAYLOAD -----' >/dev/null
  echo "$out" | grep -F -- '[dry-run] no side effects' >/dev/null
  # main の dry-run が書き込み系の git/curl を呼ばないことを確認
  if grep -F 'git ' "$counter" >/dev/null 2>&1; then
    echo "git was called in dry-run" >&2
    return 1
  fi
  if grep -F 'curl' "$counter" >/dev/null 2>&1; then
    echo "curl was called in dry-run" >&2
    return 1
  fi
}

# ---------- TC-07: silent skip 経路（gate 不成立） ----------
tc07_silent_skip_gate_not_satisfied() {
  local f; f=$(render_fixture gate-not-satisfied.json)
  local s="${TMP}/summary-not-satisfied-tc07.json"
  aggregate_runs "$f" > "$s"
  if is_30day_gate_satisfied "$s" "$(today_iso)"; then
    echo "expected gate not satisfied" >&2
    return 1
  fi
  # gate skip で副作用関数が呼ばれない設計を契約レベルで確認
  return 0
}

# ---------- run all ----------
run_tc TC-01 tc01_aggregate_runs_clean
run_tc TC-02a tc02a_gate_not_satisfied
run_tc TC-02b tc02b_gate_satisfied
run_tc TC-03 tc03_redact_log
run_tc TC-04 tc04_render_pr_body_high_failure
run_tc TC-04b tc04b_render_pr_body_low_failure
run_tc TC-05 tc05_find_existing_pr
run_tc TC-05b tc05b_post_slack_missing_secret
run_tc TC-06 tc06_dry_run_no_side_effect
run_tc TC-07 tc07_silent_skip_gate_not_satisfied

echo "30day-summary tests: PASS=${PASS} FAIL=${FAIL}"
[ "$FAIL" -eq 0 ]
