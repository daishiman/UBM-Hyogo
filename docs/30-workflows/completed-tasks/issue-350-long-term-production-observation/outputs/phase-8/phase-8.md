# Phase 8 — テスト実装手順

**[実装区分: 実装仕様書]** / **NON_VISUAL**

## 1. テストファイル配置

| パス | 種別 | 概要 |
| --- | --- | --- |
| `scripts/observation/test/test-create-reminder-issue.sh` | 新規 | bash テストランナ — TC-03〜TC-08 |
| `scripts/observation/test/fixtures/expected-body-d7.md` | 新規 | TC-08 の期待出力 |

## 2. test-create-reminder-issue.sh 実装

```sh
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$ROOT/create-reminder-issue.sh"
PASS=0; FAIL=0

assert_grep() {
  local file="$1" pattern="$2" name="$3"
  if grep -qE "$pattern" "$file"; then
    PASS=$((PASS+1)); echo "PASS: $name"
  else
    FAIL=$((FAIL+1)); echo "FAIL: $name (pattern=$pattern)"
    cat "$file"
  fi
}

run_resolve() {
  local out; out="$(mktemp)"
  GITHUB_OUTPUT="$out" \
    INPUT_RELEASE_DATE="${1:-}" \
    INPUT_OFFSET_DAYS="${2:-}" \
    TODAY_OVERRIDE="${3:-}" \
    bash "$SCRIPT" --resolve-only >/dev/null
  cat "$out"
}

# TC-03: 通常日
out="$(mktemp)"; run_resolve 2026-05-01 "" 2026-05-05 >"$out"
assert_grep "$out" "should_remind=false" "TC-03 normal day"

# TC-04: D+7
out="$(mktemp)"; run_resolve 2026-05-01 "" 2026-05-08 >"$out"
assert_grep "$out" "should_remind=true" "TC-04 D+7 trigger"
assert_grep "$out" "offset=7"           "TC-04 offset=7"

# TC-05: D+30
out="$(mktemp)"; run_resolve 2026-05-01 "" 2026-05-31 >"$out"
assert_grep "$out" "should_remind=true" "TC-05 D+30 trigger"
assert_grep "$out" "offset=30"          "TC-05 offset=30"

# TC-06: dispatch override
out="$(mktemp)"; run_resolve 2026-05-01 7 2026-06-15 >"$out"
assert_grep "$out" "should_remind=true" "TC-06 dispatch override"
assert_grep "$out" "offset=7" "TC-06 dispatch override offset"
assert_grep "$out" "target_date=2026-05-08" "TC-06 dispatch override target date"

# TC-07: 不正 offset
out="$(mktemp)"; run_resolve 2026-05-01 15 2026-05-08 >"$out"
assert_grep "$out" "should_remind=false" "TC-07 invalid offset"

# TC-08: dry-run レンダ
rendered="$(mktemp)"
RELEASE_DATE=2026-05-01 OFFSET=7 TARGET_DATE=2026-05-08 \
  bash "$SCRIPT" --dry-run >"$rendered"
if grep -q '{{' "$rendered"; then
  FAIL=$((FAIL+1)); echo "FAIL: TC-08 unrendered placeholder"
  cat "$rendered"
else
  PASS=$((PASS+1)); echo "PASS: TC-08 placeholders all replaced"
fi

echo "----- result: PASS=$PASS FAIL=$FAIL -----"
[ "$FAIL" -eq 0 ]
```

実行権限: `chmod +x scripts/observation/test/test-create-reminder-issue.sh`

## 3. 静的解析テスト

```sh
# Phase 8 で local 実行（CI 統合は別タスク）
actionlint .github/workflows/post-release-observation-reminder.yml
shellcheck scripts/observation/create-reminder-issue.sh
shellcheck scripts/observation/test/test-create-reminder-issue.sh
```

## 4. ドキュメント整合テスト

```sh
# TC-09
rg -n "D\+7|D\+30" docs/runbooks/post-release-long-term-observation.md

# TC-10
rg -n "consumed by issue-350-long-term-production-observation" \
  docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md

# TC-11
rg -n "post-release-long-term-observation" \
  .claude/skills/aiworkflow-requirements/indexes/topic-map.md
```

## 5. 実装側の修正（テスト容易性）

Phase 7 §3 で言及した通り `today_iso()` を override 可能にする:

```sh
today_iso() { echo "${TODAY_OVERRIDE:-$(date -u +%Y-%m-%d)}"; }
```

これにより TC-03〜07 が hermetic に通る。

## 6. 完了条件（Phase 8）

- [ ] `scripts/observation/test/test-create-reminder-issue.sh` 実装済 / 実行権限あり
- [ ] `bash scripts/observation/test/test-create-reminder-issue.sh` exit 0
- [ ] actionlint / shellcheck exit 0
- [ ] TC-09 / TC-10 / TC-11 の `rg` 検索が 1 件以上ヒット

## 7. 想定実行コマンド（local 一括）

```sh
bash scripts/observation/test/test-create-reminder-issue.sh \
  && actionlint .github/workflows/post-release-observation-reminder.yml \
  && shellcheck scripts/observation/*.sh scripts/observation/test/*.sh \
  && echo "ALL TESTS PASS"
```
