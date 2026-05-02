# Phase 5: 実装計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (テスト戦略) |
| 状態 | completed |

## 目的

Phase 4 のサブタスク T1〜T4 を、編集順序が一意に定まる runbook として固定する。本タスクは docs-only のため「実装」とは markdown / json の編集と `pnpm indexes:rebuild` 実行に他ならず、コードビルドや type check は本タスクの主軸検証ではない（Phase 8 で念のため通過確認するのみ）。

## 編集順序（runbook 概要）

```
Step 1: T1 物理状態調査 → 推奨案 A を最終確定
Step 2: T2 aiworkflow-requirements 3 ファイル更新
Step 3: pnpm indexes:rebuild
Step 4: T3 09a / 09b / 09c spec 参照同期
Step 5: T4 unassigned-task 内 08a 参照同期
Step 6: 検証（test -e / rg / link check / verify-indexes）
Step 7: 全 evidence を outputs/phase-11/evidence/ に保存
```

## 詳細 runbook

詳細は `outputs/phase-05/runbook.md`。要約は以下:

### Step 1: 物理状態調査（T1）

```bash
test -e docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/ \
  && echo EXISTS || echo MISSING
ls docs/30-workflows/completed-tasks/ | grep 08a || echo "no 08a in completed-tasks"
ls docs/30-workflows/02-application-implementation/ | grep 08a
ls docs/30-workflows/unassigned-task/ | grep -i 08a
```

→ 結果を `outputs/phase-11/evidence/file-existence.log` に保存。

### Step 2: aiworkflow-requirements 更新（T2）

- `legacy-ordinal-family-register.md` の 08a 行を編集（状態欄 → `current/partial`、`canonical_restored` 追記）
- `resource-map.md` の 08a path 行を編集（派生 dir を主、canonical path に「stale: not present」併記）
- `task-workflow-active.md` で 08a current/partial を維持

### Step 3: indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
```

→ 出力差分を `outputs/phase-11/evidence/aiworkflow-requirements-state-diff.log` に保存。

### Step 4: 09a / 09b / 09c 参照同期（T3）

```bash
rg "08a-parallel-api-contract" docs/30-workflows/09a-* docs/30-workflows/09b-* docs/30-workflows/09c-* 2>/dev/null
```

→ ヒットした各行を「08a-parallel-api-contract-repository-and-authorization-tests」表現に置換。

### Step 5: unassigned-task 同期（T4）

```bash
rg "08a-parallel-api-contract" docs/30-workflows/unassigned-task/
```

→ 同様の置換。起票元 `task-08a-canonical-workflow-tree-restore-001.md` には本仕様書への back-reference を追記。

### Step 6: 検証

```bash
# 残存 broken link 0 件確認
rg "docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests" docs/ \
  | tee outputs/phase-11/evidence/08a-reference-grep.log

# verify-indexes
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/ \
  | tee outputs/phase-11/evidence/verify-indexes.log

# markdown link check（存在するスクリプトに合わせ調整）
# lefthook の link-check / または rg ベース fallback
```

### Step 7: evidence 集約

`outputs/phase-11/evidence/` 配下に以下 7 ファイルを揃える（詳細は Phase 11）:

- `file-existence.log`
- `08a-reference-grep.log`
- `aiworkflow-requirements-state-diff.log`
- `9a-9b-9c-link-check.log`
- `unassigned-task-grep.log`
- `verify-indexes.log`
- `markdown-link-check.log`

## 失敗時の rollback

| 失敗事象 | rollback 手順 |
| --- | --- |
| indexes 再生成で予期せぬ大量差分 | aiworkflow-requirements 編集を git restore で原状回復し、Phase 2 設計に差し戻し |
| 09a-c 参照置換で意味不明な行が残る | 該当 spec の owner（09c 系列）に確認するため Phase 12 unassigned-task として記録し、本タスクからは触らずに参照置換を一時 skip |
| `verify-indexes-up-to-date` gate FAIL | `pnpm indexes:rebuild` を再実行し、差分を commit に含める |

## 編集順序の根拠

- Step 1 を最初に置くのは「推奨案 A を物理事実で最終確定」してから編集に進むため。
- Step 2 → Step 3 の順で aiworkflow-requirements 編集 → indexes 再生成とすることで、indexes drift をワンショットで吸収。
- Step 4 / Step 5 は aiworkflow 確定後に実施することで、参照先の語彙統一を保証。

## 完了条件

- runbook が編集順序として一意に確定
- 各 Step の成果物と保存先が明示
- 失敗時 rollback が表として整理
- `outputs/phase-05/main.md` / `outputs/phase-05/runbook.md` に記録

## 成果物

- `outputs/phase-05/main.md`
- `outputs/phase-05/runbook.md`
