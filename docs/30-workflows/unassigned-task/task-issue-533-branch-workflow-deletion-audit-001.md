# Issue #533 ブランチ混入 workflow 削除差分監査 - 未タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task_id | task-branch-workflow-deletion-audit-issue533-20260508-001 |
| タスク名 | Issue #533 ブランチ混入 workflow 削除差分監査 |
| priority | high |
| status | unassigned |
| issue_number | #579 |
| issue_url | https://github.com/daishiman/UBM-Hyogo/issues/579 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 発見元 | Issue #533 Phase 12 branch status verification |
| 発見日 | 2026-05-08 |
| 対象差分 | `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/` と `docs/30-workflows/task-02-w2-wrangler-env-injection/` の削除差分 |

---

## 背景

Issue #533 の Phase 12 branch status verification で、Issue #533 の主目的とは独立して見える workflow root の削除差分が同一ブランチに混在していることが確認された。

対象は次の 2 件である。

- `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/`
- `docs/30-workflows/task-02-w2-wrangler-env-injection/`

この削除が意図的な完了移動、別ブランチ由来の整理、または事故的な unrelated deletion diffs なのかを確定しないまま Issue #533 の差分として扱うと、レビュー範囲が曖昧になり、workflow evidence や参照履歴を失う可能性がある。

## 目的

現在の Issue #533 ブランチに混在している上記 2 workflow root の削除差分を監査し、削除維持・復元・completed-tasks への移動確認・別ブランチ分離のいずれが正しいかを判断できる状態にする。

## 受入条件

- AC-1: 対象 2 directory の削除差分が `git diff --name-status` で一覧化されている。
- AC-2: 各削除差分について、意図的削除 / 完了移動済み / 誤削除疑い / 別ブランチ対象の分類が記録されている。
- AC-3: `docs/30-workflows/completed-tasks/` 配下に同等 workflow が存在するか確認されている。
- AC-4: 対象 workflow slug への参照検索結果が記録され、参照切れの有無が判断されている。
- AC-5: Issue #533 の本来差分に unrelated deletion diffs を混ぜるか除外するかの判断材料が揃っている。
- AC-6: ユーザー承認なしに復元、削除確定、移動、commit、Issue 作成、PR 作成を行っていない。

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-084931-wt-5/docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/`
- 症状: Issue #533 の Phase 12 branch status verification 中に、Issue #533 と直接関係しない workflow root 削除差分として混在しており、削除意図を `git status` だけでは判定できない。
- 参照: Issue #533 Phase 12 branch status verification

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-084931-wt-5/docs/30-workflows/task-02-w2-wrangler-env-injection/`
- 症状: Issue #533 の主タスク範囲外に見える削除差分として混在しており、completed-tasks 移動済みなのか、誤削除なのか、別ブランチ由来なのかを監査しないと PR 差分の境界が不明確になる。
- 参照: Issue #533 Phase 12 branch status verification

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Issue #533 の PR に unrelated deletion diffs が混ざる | Phase 1 で `git diff --name-status -- docs/30-workflows` を保存し、対象 2 directory を Issue #533 本体差分と分離して分類する |
| 誤削除を削除確定として扱い workflow evidence を失う | `completed-tasks/` の同名・関連名確認と slug 参照検索を行い、ユーザー承認前に復元や削除確定を行わない |
| 完了移動済み workflow を誤って復元し二重管理する | `find docs/30-workflows/completed-tasks -maxdepth 2 -type d` と `rg` で移動先・参照先を確認してから判断する |
| 対象外の workflow やユーザー変更へ触れてしまう | 本タスクの対象を 2 directory の削除差分監査に限定し、既存ファイル変更や移動は別タスクまたは明示承認後に扱う |
| 参照切れを見逃す | 対象 slug を `docs/`, `.claude/`, `.agents/` から検索し、参照元と期待対応を監査レポートに記録する |

## 検証方法

### 差分確認

```bash
git status --short
git diff --name-status -- docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration docs/30-workflows/task-02-w2-wrangler-env-injection
```

期待: 対象 2 directory の削除差分が確認でき、Issue #533 の本来差分と区別して記録できる。

### completed-tasks 確認

```bash
find docs/30-workflows/completed-tasks -maxdepth 2 -type d | sort | rg "issue-503-ut-07b-fu-01-followup-cursor-semantics-migration|task-02-w2-wrangler-env-injection"
```

期待: 移動済み候補の有無が明確になり、移動済みなら削除維持、未移動なら復元または別対応の判断材料になる。

### 参照検索

```bash
rg -n "issue-503-ut-07b-fu-01-followup-cursor-semantics-migration|task-02-w2-wrangler-env-injection" docs .claude .agents
```

期待: 参照元が一覧化され、削除維持時に参照切れが発生するか判断できる。

### 完了判定

期待:

- 対象 2 directory それぞれに分類と根拠がある。
- 復元、移動、削除維持のいずれもユーザー承認なしに実行していない。
- commit、Issue 作成、PR 作成を行っていない。

## スコープ

### 含む

- `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/` の削除差分監査
- `docs/30-workflows/task-02-w2-wrangler-env-injection/` の削除差分監査
- `git status --short` / `git diff --name-status` による削除差分の記録
- `completed-tasks/` 配下の移動済み確認
- 対象 slug の参照検索
- 削除維持・復元・completed-tasks 移動確認・別ブランチ分離の判断材料整理

### 含まない

- ユーザー承認なしの復元、削除確定、移動
- `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/` と `docs/30-workflows/task-02-w2-wrangler-env-injection/` 以外の workflow 削除差分監査
- Issue #533 本体実装や Phase 成果物の修正
- 既存ファイルの編集
- commit、Issue 作成、PR 作成、push
