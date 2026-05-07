# Phase 6 — テスト戦略

**[実装区分: 実装仕様書]** / **NON_VISUAL**

## 1. テスト分類

| 分類 | 対象 | ツール |
| --- | --- | --- |
| 構文（YAML） | workflow YAML | `actionlint` |
| 構文（shell） | `create-reminder-issue.sh` | `shellcheck` |
| ロジック（offset / 冪等） | shell の `--resolve-only` / `--dry-run` | bash + GITHUB_OUTPUT mock |
| レンダ（template） | `--dry-run` 出力 | `diff` |
| 統合（実起票） | workflow_dispatch on test repo | manual（任意） |
| ドキュメント整合 | runbook / SSOT / 09c trace | `rg` 検索 |

## 2. テストケース一覧

| ID | 対象 | ケース | 期待 |
| --- | --- | --- | --- |
| TC-01 | YAML | `actionlint .github/workflows/post-release-observation-reminder.yml` | exit 0 |
| TC-02 | shell | `shellcheck scripts/observation/create-reminder-issue.sh` | exit 0 |
| TC-03 | resolve-only / 通常日 | release=2026-05-01, today=2026-05-05 → diff=4 | `should_remind=false` |
| TC-04 | resolve-only / D+7 | release=2026-05-01, today=2026-05-08 → diff=7 | `should_remind=true`, `offset=7` |
| TC-05 | resolve-only / D+30 | release=2026-05-01, today=2026-05-31 → diff=30 | `should_remind=true`, `offset=30` |
| TC-06 | resolve-only / dispatch input | `INPUT_RELEASE_DATE=2026-05-01` `INPUT_OFFSET_DAYS=7` | `should_remind=true` |
| TC-07 | resolve-only / 不正 offset | `INPUT_OFFSET_DAYS=15` | `should_remind=false` |
| TC-08 | dry-run / レンダ | `RELEASE_DATE=...` で `--dry-run` 実行 | placeholder が全置換 (`{{...}}` が stdout に残らない) |
| TC-09 | docs 整合 | `rg -n "D\+7\|D\+30" docs/runbooks/post-release-long-term-observation.md` | 必ず 1 件以上 |
| TC-10 | 09c trace | `rg -n "consumed by issue-350" docs/30-workflows/09c-.../outputs/phase-12/unassigned-task-detection.md` | 1 件以上 |
| TC-11 | SSOT 反映 | `rg -n "post-release-long-term-observation" .claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 1 件以上 |

## 3. テスト実装方針

### 3.1 shell ロジックテスト（実装は Phase 8）

bats / shunit2 を入れず、シンプルな bash テストランナで足りる:

```sh
# scripts/observation/test/test-create-reminder-issue.sh
set -euo pipefail
SCRIPT="$(cd "$(dirname "$0")/.." && pwd)/create-reminder-issue.sh"

run_resolve() {
  local out
  out="$(mktemp)"
  GITHUB_OUTPUT="$out" \
    INPUT_RELEASE_DATE="$1" INPUT_OFFSET_DAYS="${2:-}" \
    bash "$SCRIPT" --resolve-only
  cat "$out"
}
# TC-04 例
result="$(run_resolve 2026-05-01 7)"
echo "$result" | grep -q "should_remind=true"
```

> **注**: `today_iso()` は環境依存のため、テスト時は `today_iso() { echo "$FAKE_TODAY"; }` を関数オーバーライドで注入する。実装側は `${TODAY_OVERRIDE:-$(date -u +%Y-%m-%d)}` で受けるようにする（Phase 7 でこの override hook を仕込む）。

### 3.2 YAML / shellcheck

```sh
# Phase 9 検証コマンド
actionlint .github/workflows/post-release-observation-reminder.yml
shellcheck scripts/observation/*.sh
```

ローカルに無い場合:
```sh
brew install actionlint shellcheck   # macOS
```

## 4. coverage 目標

`scripts/observation/create-reminder-issue.sh` は coverage tool が無いため、関数単位で TC-03〜TC-08 の 6 ケース通過 = 主要分岐 100% を以て充足とする。

## 5. CI 統合方針

| step | 配置 |
| --- | --- |
| actionlint | 既存 `verify-indexes.yml` または別 lint job に追加（任意 — 今回 cycle では local 検証のみ必須） |
| shellcheck | 同上 |

> **判断**: CI への統合は範囲外（CONST_007 例外: 本タスクの主目的は reminder 自動化であり、lint CI 整備は別 governance タスク）。Phase 12 unassigned に「actionlint/shellcheck CI 統合」を 1 件出力する。

## 6. 完了条件

- [ ] TC-01〜TC-11 のテストケース表が固定済
- [ ] shell テストの override hook 設計が確定（`TODAY_OVERRIDE`）
- [ ] CI 統合の境界（local 必須 / CI は別タスク）が明示済
