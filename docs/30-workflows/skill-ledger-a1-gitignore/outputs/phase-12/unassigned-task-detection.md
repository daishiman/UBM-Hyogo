# 未割当タスク検出レポート（current/baseline 分離形式）

## 概要

skill-ledger-a1-gitignore ワークフロー（docs-only / NON_VISUAL / spec_created）の Phase 1〜11 で発見された派生課題を **current / baseline** に分離して列挙する。**0 件でも本ファイルは出力必須**。

| 区分 | 意味 |
| --- | --- |
| **baseline** | 本タスク開始前から既に独立タスクとして起票・認識されている派生タスク群（A-2 / A-3 / B-1 / T-6 等）。**本タスクの未タスク検出ではカウントしない**。 |
| **current** | 本タスク Phase 1〜11 walkthrough で **新たに発見された** 派生課題。Phase 12 で formalize 対象。 |

## baseline（既知の派生タスク群 — 本タスク発見ではないので未タスク数にカウントしない）

| ID | タスク | 状態 | 備考 |
| --- | --- | --- | --- |
| A-2 | task-skill-ledger-a2-fragment | unassigned | 本タスクの必須前提。`LOGS.md` を fragment / `_legacy.md` に退避 |
| A-3 | task-skill-ledger-a3-progressive-disclosure | unassigned | skill 改修ガイドへの Anchor 追記 |
| B-1 | task-skill-ledger-b1-gitattributes | unassigned | A-1 完了後の `merge=union` 等 attribute 設定 |
| T-6 | task-skill-ledger-hooks | missing at start / created in this Phase 12 review | post-commit / post-merge hook 本体実装 |

> A-2 / A-3 / B-1 は本タスクで発見された未タスクではなく、上流の task-conflict-prevention-skill-state-redesign Phase 12 で既に検出済み。T-6 はファイル実体が存在しなかったため、本 Phase 12 review で `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md` として作成した。

## current（本タスク Phase 1〜11 で発見した派生課題）

| # | 検出元 Phase | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- | --- |
| 1 | Phase 11 walkthrough §保証できない範囲 | hook 実行時の file system race（4 worktree 並列で `pnpm indexes:rebuild` が同一 inode を書き込む際の挙動） | 検証 | Phase 5 実装ランブック完了後の実走 PR で観測ログ採取 | `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md` |
| 2 | Phase 11 walkthrough §保証できない範囲 | `pnpm indexes:rebuild` 失敗時の派生物部分書込（中断時の半端 JSON リカバリ手順未確立） | 設計 | リカバリ手順を hook 実装タスクの受入条件に追加 | `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md` |
| 3 | Phase 11 walkthrough §保証できない範囲 | `git merge --no-ff` での実派生物 conflict 件数の実走確認 | 検証 | Phase 5 実走 PRで実測し、hook task の smoke gate に接続 | `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md` / Phase 5 実装 PR |
| 4 | Phase 11 walkthrough 発見事項 #2 | smoke コマンドで `wait` 後の return code 個別集約（並列失敗の検出可能化） | 改善 | 既に implementation-guide.md Part 2 に反映済 | 解決済（Phase 12 内で対応） |

> **件数集計**: current 4 件（うち #4 は Phase 12 内で解決済）。**実質申し送り 3 件**。

## SF-03 4 パターン照合（設計タスク特有の未タスクパターン）

`phase-12-documentation-guide.md` SF-03 で要求される 4 パターン照合を実施。

| パターン | 候補 | 該当 | 備考 |
| --- | --- | --- | --- |
| 型定義 → 実装 | 型を定義したが実装未完了 | **N/A** | 本タスクは型定義を行わない（git 管理境界の変更のみ） |
| 契約 → テスト | IPC 契約・インターフェースを設計したが対応統合テスト未作成 | **N/A** | 本タスクは IPC 契約に触れない |
| UI 仕様 → コンポーネント | 画面仕様を設計したが React コンポーネント未実装 | **N/A** | 本タスクは UI 差分なし（NON_VISUAL） |
| 仕様書間差異 → 設計決定 | 複数仕様書で矛盾する記述、決定未確定 | **N/A** | 上流 runbook（Phase 5 gitignore-runbook.md）と本ワークフロー間で矛盾なし |

> **本タスクは git 管理境界の変更であり、4 パターンのいずれにも該当しない**。設計タスクパターン確認済、該当 0 件。

## Phase 10 MINOR 追跡

> 本ワークフローは Phase 4〜10 の仕様書を作成済みだが、実装状態は pending として残している。現時点の Phase 10 MINOR 指摘は 0 件。実装 PR 側で runtime smoke を実走した際に新規 MINOR が出れば追跡する。

| MINOR ID | 指摘内容 | 解決予定 Phase | 状態 |
| --- | --- | --- | --- |
| （なし） | Phase 10 が pending のため MINOR 未発生 | — | N/A |

## 関連タスクへの双方向リンク反映

- A-2: `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md` ← 本ワークフローを下流として記載（Step 1-C で反映）
- A-3 / B-1: 既存仕様として参照のみ。既存 completed-task ファイルは編集しない
- T-6: `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md` を新規作成し、current #1〜#3 の受け皿にした

## 結論

- baseline: 4 件（既知 / カウント外）
- current: 4 件（うち 1 件 Phase 12 内解決、3 件を新規 T-6 未タスク / Phase 5 実装 PR へ申し送り）
- SF-03 4 パターン: 全て N/A（git 管理境界変更のため）

**本タスク起点の新規未タスク起票は 1 件**: `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md`。current の #1〜#3 はこの T-6 と Phase 5 実装 PR の入力として吸収する。

## 完了確認

- [x] current / baseline 分離形式
- [x] 0 件でも本ファイル出力済
- [x] SF-03 4 パターン照合（全 N/A 明記）
- [x] baseline 既存タスク 4 件をカウント外として明示
- [x] current 申し送り 3 件の割り当て先候補を明記
