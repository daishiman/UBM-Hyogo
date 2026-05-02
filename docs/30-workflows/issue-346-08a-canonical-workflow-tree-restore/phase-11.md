# Phase 11: evidence 取得 (NON_VISUAL)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 11 / 13 |
| Phase 名称 | evidence 取得 (NON_VISUAL) |
| 作成日 | 2026-05-02 |
| 前 Phase | 10 (ロールアウト / 後続連携) |
| 次 Phase | 12 (close-out) |
| 状態 | completed |
| visualEvidence | NON_VISUAL |
| user_approval_required | false |

## 目的

08a canonical workflow tree の状態正本化（推奨案 A）の正しさを、コード変更なしで観測可能な 7 種の log evidence によって裏付け、AC-1〜AC-7 を Phase 8 / 9 と独立に再検証する。本タスクは docs-only / NON_VISUAL であり、`WorkerPreflightEvidence` 4 軸（health / config / logs / runtime）のうち本 Phase で取得すべきは **config 軸（aiworkflow drift）と logs 軸（grep / link check）** のみで、health / runtime は **本タスク範囲外**。

## 必須 evidence 7 種

| # | ファイル | 取得コマンド | 期待観測 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/evidence/file-existence.log` | `test -e ... && echo EXISTS \|\| echo MISSING` を canonical / completed-tasks / 派生 dir に対して順次実行 | canonical=EXISTS、08a-A=EXISTS（follow-up） |
| 2 | `outputs/phase-11/evidence/08a-reference-grep.log` | `rg "08a-parallel-api-contract" docs/ .claude/` | canonical 直接参照が canonical restoration 注記付きのみに収束 |
| 3 | `outputs/phase-11/evidence/aiworkflow-requirements-state-diff.log` | `git diff -- .claude/skills/aiworkflow-requirements/references/{legacy-ordinal-family-register,resource-map,task-workflow-active}.md` | 08a canonical path が current として trace 可能 |
| 4 | `outputs/phase-11/evidence/9a-9b-9c-link-check.log` | `rg "08a-parallel-api-contract-repository-and-authorization-tests" docs/30-workflows/09[abc]-* 2>/dev/null \|\| echo NO_HITS` | 実在 canonical path への参照 |
| 5 | `outputs/phase-11/evidence/unassigned-task-grep.log` | `rg "08a-parallel-api-contract" docs/30-workflows/unassigned-task/` | 直接参照が実在 canonical path に解決 |
| 6 | `outputs/phase-11/evidence/verify-indexes.log` | `mise exec -- pnpm indexes:rebuild && git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/` | exit 0（drift 0） |
| 7 | `outputs/phase-11/evidence/markdown-link-check.log` | repository に応じた link check（lefthook / rg ベース fallback）を実行 | broken link 0 件 |

## WorkerPreflightEvidence 4 軸の該当判定

| 軸 | 本タスクでの該当 | 備考 |
| --- | --- | --- |
| health | **N/A** | docs-only であり deploy / runtime endpoint 観測は不要 |
| config | **必須**（verify-indexes.log / aiworkflow-requirements-state-diff.log） | aiworkflow-requirements が新状態で同期しているかの設定整合 |
| logs | **必須**（grep / link check 系） | broken link 解消の観測 |
| runtime | **N/A** | Worker runtime 観測は本タスク範囲外 |

## runbook（取得順序 / 期待出力 / 失敗時対応）

### Step 1: file-existence

```bash
{
  test -e docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/ \
    && echo "canonical: EXISTS" || echo "canonical: MISSING"
  test -e docs/30-workflows/02-application-implementation/08a-A-public-use-case-coverage-hardening/ \
    && echo "followup 08a-A: EXISTS" || echo "followup 08a-A: MISSING"
  ls docs/30-workflows/completed-tasks/ | grep -E "^08a" || echo "completed-tasks/08a*: MISSING"
} | tee docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/file-existence.log
```

- 期待: canonical=EXISTS / 08a-A follow-up=EXISTS
- 失敗時: Phase 1 物理状態調査に差し戻し

### Step 2: 08a-reference-grep

```bash
rg "08a-parallel-api-contract" docs/ .claude/ \
  | tee docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/08a-reference-grep.log
```

- 期待: 残存参照は実在 canonical path または本仕様書内のみ
- 失敗時: T3 / T4 の置換漏れを再修正

### Step 3: aiworkflow-requirements-state-diff

```bash
git diff -- .claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md \
            .claude/skills/aiworkflow-requirements/indexes/resource-map.md \
            .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  | tee docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/aiworkflow-requirements-state-diff.log
```

- 期待: 08a 行に `current/partial` / `canonical path restored` を含む
- 失敗時: T2 編集を Phase 5 runbook 通りに再実行

### Step 4: 9a-9b-9c-link-check

```bash
rg "08a-parallel-api-contract-repository-and-authorization-tests" \
  docs/30-workflows/09a-* docs/30-workflows/09b-* docs/30-workflows/09c-* 2>/dev/null \
  | tee docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/9a-9b-9c-link-check.log \
  || echo "NO_HITS" >> docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/9a-9b-9c-link-check.log
```

- 期待: 実在 canonical path への参照として解決
- 失敗時: T3 で該当 spec を再修正

### Step 5: unassigned-task-grep

```bash
rg "08a-parallel-api-contract" docs/30-workflows/unassigned-task/ \
  | tee docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/unassigned-task-grep.log
```

- 期待: 実在 canonical path への参照として解決
- 失敗時: T4 で再修正

### Step 6: verify-indexes

```bash
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/ \
  | tee docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/verify-indexes.log \
  && echo "DRIFT 0" >> docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/verify-indexes.log
```

- 実測結果: `mise exec -- pnpm indexes:rebuild` 実行済み。生成は成功し、`resource-map.md` には Issue #346 restore row の意図的な index 更新が残る。
- 期待: exit 0 / `DRIFT 0`
- 失敗時: 差分を commit に含めて再実行

### Step 7: markdown-link-check

```bash
# lefthook / 既存 link check スクリプトに応じて差し替え
rg -e '\(docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests' docs/ \
  | tee docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/markdown-link-check.log \
  || echo "NO_BROKEN_LINK" >> docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/markdown-link-check.log
```

- 実測結果: full checker は未設定のため targeted check として記録。復元済み canonical root と 09c の上流 contract reference は存在確認 PASS。
- 期待: broken link 0 件
- 失敗時: 該当ファイルを再修正

## secret hygiene 再確認

```bash
grep -iE '(token|cookie|authorization|bearer|set-cookie|secret|api[_-]?key|client[_-]?secret|hmac)' \
  docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/evidence/*.log \
  || echo PASS
```

- 期待: `PASS`（0 hit）
- 失敗時: log 再生成 / redaction

## observation note（実取得時に `outputs/phase-11/main.md` に追記）

- 取得時刻（UTC）
- 実行 Node / pnpm バージョン（`mise exec --` 経由で Node 24.15.0 / pnpm 10.33.2）
- AC-1〜AC-7 の充足判定（PASS / FAIL）
- secret hygiene grep 結果（PASS / FAIL）
- anomaly があれば記述

## 異常時処理

| 事象 | 対応 |
| --- | --- |
| canonical 不在のはずが EXISTS | 状態決定（C → A 維持）の見直し、Phase 2 に差し戻し |
| verify-indexes drift > 0 | `pnpm indexes:rebuild` 出力を commit に含めて再取得 |
| broken link 残存 | T3 / T4 の置換漏れを修正、再 grep |
| secret hygiene fail | log を redaction、取得コマンド見直し |

## 完了条件

- [x] 必須 evidence 7 ファイル実体化済み
- [x] verify-indexes 実測 PASS（`pnpm indexes:rebuild` 成功 + Issue #346 resource-map row を意図的 index 更新として保持）
- [x] markdown targeted link check PASS（full checker は未設定）
- [x] secret hygiene grep 対象コマンド定義済み
- [x] observation note の記録欄を `outputs/phase-11/main.md` に定義
- [x] artifacts.json の phase 11 status を `completed`

## 次 Phase

- 次: Phase 12 (close-out)
- 引き継ぎ: 7 種 evidence + observation note
