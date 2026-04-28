# task-03a-workflow-relocation-audit-001

## Metadata

| Field | Value |
| --- | --- |
| Source | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue review |
| Status | unassigned |
| Priority | High |
| Owner candidate | docs workflow maintainer |

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | task-03a-workflow-relocation-audit-001 |
| タスク名     | 02b/02c/旧03a workflow 削除の意図確認と整流 |
| 分類         | リファクタリング（ref） / ドキュメント |
| 対象機能     | docs/30-workflows/ ツリー整流 |
| 優先度       | 高 |
| 見積もり規模 | 小〜中規模 |
| ステータス   | 未実施 |
| 発見元       | Phase 12（unassigned-task-detection / branch review） |
| 発見日       | 2026-04-28 |

## Problem

The branch contains broad deletions under `docs/30-workflows/02-application-implementation/` for 02b, 02c, and the old 03a path. 03a now has a canonical root at `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/`, but the 02b/02c deletions are outside the 03a implementation scope.

## Required Work

- Decide whether these deletions are intentional archival/relocation or accidental loss.
- If intentional, add the new canonical locations and update references.
- If accidental, restore the deleted workflow files in a dedicated branch cleanup task.

## Acceptance Criteria

- `git status --short` no longer shows unexplained workflow deletions outside the active task scope.
- Any moved workflow has a canonical destination and updated references.

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

03a 実装ブランチに `docs/30-workflows/02-application-implementation/` 配下（02b / 02c / 旧 03a path）の広範な削除が含まれているが、03a の正本は `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/` に既に存在する。02b/02c の削除は 03a スコープ外であり、意図確認なしに main へ取り込めない。

### 1.2 問題点・課題

- 削除が意図的な relocation か事故的な loss か判別がついていない。
- 参照が残っている場合、リンク切れが発生する可能性。

### 1.3 放置した場合の影響

- main マージ後に 02b/02c 仕様が失われる事故。
- 後続 wave（02b/02c 着手者）が参照を見つけられず再作業。

## 2. 何を達成するか（What）

### 2.1 目的

削除内容を audit し、relocation / archive / restore のいずれかに分類して整流する。

### 2.2 最終ゴール

- `git status --short` に 03a スコープ外の不明な workflow 削除が残っていない。
- 移動されたワークフローには canonical destination と更新済み参照が存在する。

### 2.3 スコープ

- 含む: 削除ファイルの分類、relocation の場合の新パス整備、参照の更新、accidental の場合の復元
- 含まない: 02b/02c の機能仕様自体の更新

### 2.4 成果物

- audit レポート（分類結果）
- relocation の場合は新パス + 参照更新差分
- accidental の場合は復元 PR（別ブランチ）

## 3. どのように実行するか（How）

### 3.1 前提条件

- 03a の Phase 13 PR ブランチが識別可能であること

### 3.2 依存タスク

- なし（独立 audit タスク）

### 3.3 必要な知識

- `git log -- <path>` での履歴調査
- `docs/30-workflows/` の命名規則

### 3.4 推奨アプローチ

1. 削除一覧を `git diff --name-status main...HEAD -- docs/30-workflows/02-application-implementation/` で抽出。
2. 各ファイルの最終 commit と意図を `git log` で調査。
3. relocation の場合は新パスを確認 → 参照（grep）を更新。
4. accidental の場合は別ブランチで `git checkout main -- <path>` で復元。

## 4. 実行手順

1. 削除一覧の抽出。
2. 1 件ずつ意図判定（relocation / archive / accidental）。
3. 結果を audit レポートに記録。
4. relocation: 新パスと参照を更新。
5. accidental: 別ブランチで復元 PR を作成。
6. 03a PR 上では削除を取り消すか、別 PR に切り出すかを判断。

## 5. 完了条件チェックリスト

- [ ] 全削除ファイルの分類が audit レポートに記録されている
- [ ] relocation 分は新パスが存在し、参照が更新済み
- [ ] accidental 分は復元 PR が起票されている
- [ ] `git status --short` に説明できない削除が残っていない

## 6. 検証方法

- `git diff --stat main...HEAD -- docs/30-workflows/` を実行し、削除が意図に整合
- `grep -R "02-application-implementation" docs/` でリンク切れがないことを確認

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| 02b/02c 仕様の喪失 | 高 | 中 | accidental と判定したら main から即復元 |
| 参照リンク切れ | 中 | 高 | grep で参照検索、relocation 時に一括更新 |

## 8. 参照情報

- `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/phase12-task-spec-compliance-check.md`

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 03a 実装ブランチに 03a スコープ外の workflow 削除が含まれているのを Phase 12 で発見した。 |
| 原因 | 並列 wave のブランチ操作で、別タスク由来の削除が同一ブランチに混入した可能性。worktree 起動位置の混同（CLAUDE.md 警告事項）も要因候補。 |
| 対応 | 03a Phase 13 PR では削除を維持しつつ、本未タスクで意図確認 & 整流を別 PR で行う方針に分離。 |
| 再発防止 | 並列タスクは必ずワークツリーディレクトリで Claude Code を起動し、PR 作成前に `git diff --name-status main...HEAD` でスコープ外変更が無いか必ず確認する。 |

### 補足事項

- 元 detection 行: `unassigned-task-detection.md` 表「02b/02c/旧03a workflow 削除の意図確認」。
