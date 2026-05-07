---
description: |
  完了タスクのクローズアウト処理を一括実行するスラッシュコマンド。
  未タスク仕様書作成・苦戦箇所記録・GitHub Issue 追加・完了タスク移動を SubAgent で並列実行する。

  🔄 ワークフロー:
  1. ブランチ状況分析（変更内容・未タスク洗い出し・Phase-12 完了判定）
  2. 未タスク仕様書作成（並列 SubAgent）
  3. GitHub Issue 追加（2回確認）
  4. 完了タスク移動（Phase-12 完了時のみ）

  ⚠️ コミット・PR 作成は実行しない（/ai:diff-to-pr で実施）

  ⚙️ このコマンドの設定:
  - argument-hint: なし
  - allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Task
  - model: sonnet

  トリガーキーワード: 未タスク作成, タスククローズアウト, close task
argument-hint: ""
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Task
model: sonnet
---

# 完了タスクのクローズアウト処理

## 目的

現在のブランチで進行中のワークフロータスクについて、Phase-12 完了時点で発生する一連の事務処理を1コマンドで完結させる。**コミット・PR 作成は本コマンドの責務外**（`/ai:diff-to-pr` で実施）。

## 処理対象

- 未タスク仕様書作成（task-specification-creator フォーマット準拠）
- 苦戦箇所の記録（仕様書 §9 備考に必須記入）
- GitHub Issue 追加（優先度ラベル付き、2回確認）
- 完了タスク移動（Phase-12 完了時のみ）

## ビジネスルール

- CONST_001: コミット・PR は実行禁止（`/ai:diff-to-pr` の責務）
- CONST_002: 開発状況の確認はトータル2回実施（誤り多発対策）
- CONST_003: 未タスク仕様書は task-specification-creator skill のフォーマットに完全準拠
- CONST_004: 苦戦箇所を各仕様書 §9 備考に必須記入（症状/原因/対応/再発防止）
- CONST_005: aiworkflow-requirements skill の関連仕様を反映

## ディレクトリ構成

| ディレクトリ | 用途 |
| --- | --- |
| `docs/30-workflows/<task>/outputs/phase-12/` | Phase-12 成果物 |
| `docs/30-workflows/unassigned-task/` | 未タスク仕様書の出力先 |
| `docs/30-workflows/completed-tasks/` | 完了タスクの移動先 |

## 完了タスク移動条件

以下を全て満たす場合のみ実行:

- `<task>/outputs/phase-12/` に成果物が生成済み
- Phase-12 までタスクが完了している
- 上記成立時、以下を `docs/30-workflows/completed-tasks/` に移動:
  - 該当タスクの未タスクファイル（`docs/30-workflows/unassigned-task/` 内）
  - 該当タスク仕様書ディレクトリ（`docs/30-workflows/<task>/`）

## 実行フロー

### Phase 1: ブランチ状況分析

1. 現在のブランチの変更内容を `git status` / `git diff` で確認
2. `docs/30-workflows/<task>/outputs/phase-12/unassigned-task-detection.md` を読む
3. Phase-12 成果物の生成状況を確認
4. 未タスク（残作業・追加対応が必要な項目）を洗い出す
5. 苦戦箇所を `outputs/phase-2,3,5,8,12/` から特定
6. **canonical alias closeout 判定**: 当該 root が canonical 実体を保持しないか確認（`artifacts.json` の `metadata.workflow_state=completed_alias` / `canonical_workflow=<root>` 有無）。alias の場合、Layer 1-6 本文と consumed unassigned-task stub の双方を以下の grep gate で検証する。
7. **grep stale prose before 4 conditions PASS**（必須ゲート / L-IDENT-007 由来 / phase-12-pitfalls.md UBM-030）: 4 conditions PASS と判定する**前に** `rg -n "<旧 endpoint or table or screenshot path or commit/push/PR 文面>" docs/30-workflows/<task> docs/30-workflows/unassigned-task/<consumed-stub>.md` を実行し、ヒット 0 件を確認する。metadata parity だけでは PASS 判定しない。stale ヒットがあれば Phase 2/3 で本文撤回・stub 化を行う。

**ゲート**: 分析完了 + grep gate ヒット 0 件まで後続フェーズに進まない。

### Phase 2: 未タスク仕様書作成（SubAgent 並列）

タスク 1 件につき 1 SubAgent を起動。各 SubAgent の責務:

1. `docs/30-workflows/unassigned-task/02b-followup-001-status-readonly-helper.md` を Read してフォーマット正本を確認
2. task-specification-creator skill の Phase 12 テンプレを参照
3. aiworkflow-requirements skill の関連 references を参照
4. 担当未タスクの仕様書を `docs/30-workflows/unassigned-task/` に作成
5. §9 備考に苦戦箇所を必須記入（症状/原因/対応/再発防止）

**並列実行**: 独立タスクは並列、依存ありは直列。

### Phase 3: GitHub Issue 追加（2回確認）

1. github-issue-manager skill を参照
2. **1回目確認**: `gh issue list` で既存 Issue を取得し、新規未タスクと照合
3. 新規未タスクには `gh issue create` で Issue を作成
   - 優先度ラベル: `priority:high` / `priority:medium` / `priority:low`
   - 種別ラベル: `type:bugfix` / `type:improvement` / `documentation` / `enhancement` 等
   - ステータスラベル: `status:unassigned`
   - Issue 本文に Phase-12 implementation-guide.md と検出元パスを明記
4. **2回目確認**: 作成 Issue を `gh issue view --json` で再検証
5. 仕様書 yaml の `issue_number:` を作成 Issue 番号で更新

### Phase 4: 完了タスク移動

完了タスク移動条件を満たす場合のみ実行:

```bash
mkdir -p docs/30-workflows/completed-tasks
mv docs/30-workflows/unassigned-task/<該当ファイル群> docs/30-workflows/completed-tasks/
mv docs/30-workflows/<該当タスク仕様書ディレクトリ> docs/30-workflows/completed-tasks/
```

条件未充足時は移動せず状況を報告。

## 制約

- 必須経由: フェーズ1→2→3→4 の順序（省略禁止）
- コミット・PR 禁止（`/ai:diff-to-pr` で実施）
- Phase-13 が未完了でも実行可能（ユーザー承認は別途）

## 完了報告

以下を1メッセージで報告:

- 検出された未タスク件数と各 Issue 番号
- 完了タスク移動の実施有無と移動対象パス
- 苦戦箇所が記録された仕様書ファイル一覧
- 次の推奨ステップ（通常 `/ai:diff-to-pr`）
