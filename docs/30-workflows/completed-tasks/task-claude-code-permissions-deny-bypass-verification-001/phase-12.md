# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 11 |
| 下流 | Phase 13 (PR 作成) |
| 状態 | pending |

## 目的

Phase 1〜11 の成果物を Phase 12 の canonical 成果物としてまとめる。本タスクは検証実施を
伴わないため、ドキュメント更新は **(a) 上流タスクの R-2 欄更新方針**と **(b) 下流タスク apply-001
への前提条件転記方針**の確定が中心となる。

## 必須 canonical 成果物

`outputs/phase-12/main.md` は Phase 12 サマリとして出力し、下記 6 ファイルを canonical 詳細成果物とする。

| Task | 成果物 | 必須 |
| --- | --- | --- |
| 12-1 | `outputs/phase-12/implementation-guide.md`（Part 1 中学生レベル + Part 2 技術詳細） | ✅ |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` | ✅ |
| 12-3 | `outputs/phase-12/documentation-changelog.md` | ✅ |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力） | ✅ |
| 12-5 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力） | ✅ |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | ✅ |

## Task 12-1: 実装ガイド（2 パート構成）

### Part 1（中学生レベル）

例え話:
> 家のドアに「開けるな」って張り紙があっても、合鍵で「確認しないモード」に
> しちゃったら張り紙は意味があるのか？っていう問題を、ちゃんと実験して確かめる話です。
> 本物の家じゃなくて、すぐ壊して捨てられる仮の小屋でやります。

なぜ必要か:
- 合鍵モード下で張り紙が無視されるなら、合鍵モードを使うのは危険
- 効くと分かれば、合鍵モードを安心して常用できる

何をするか:
- まず説明書（公式 docs）を読む
- 説明書に書いてなかったら、仮の小屋で実験する
- 結果を記録して、次のタスク（合鍵を本当に常用にするタスク）に渡す

### Part 2（技術詳細）

- E-1: 公式 docs 一次調査（Phase 1）
- E-2: isolated repo 検証プロトコル（Phase 2 / Phase 5 runbook）
- E-3: 判定 NO 時の alias フォールバック（Phase 2 alias-fallback-diff）
- E-4: 上流 R-2 / 下流 apply-001 への反映（本 Phase）
- 設定可能パラメータ: なし（本タスクは設定変更を伴わない）
- エラーハンドリング: Phase 4 TC-VERIFY-05 / 安全チェック
- 視覚証跡: **NON_VISUAL のため Phase 11 スクリーンショット不要**。代替証跡は `outputs/phase-11/manual-smoke-log.md` / `verification-log.md` / `outputs/phase-10/final-review-result.md`

## Task 12-2: システム仕様更新

### Step 1-A: タスク完了記録

- 「完了タスク」セクションへ本タスク行を追加（spec_created）
- LOGS.md × 2（aiworkflow-requirements / task-specification-creator）に同波更新（該当する場合）
- topic-map.md にエントリ追加（該当する場合）

### Step 1-B: 実装状況テーブル

- 本タスクのステータス: `spec_created`（検証実施は別途承認後）

### Step 1-C: 関連タスクテーブル

- 上流: `task-claude-code-permissions-decisive-mode`（spec_created）
- 下流: `task-claude-code-permissions-apply-001`（本タスク完了がブロッカー解除条件）

### Step 2: システム仕様更新（条件付き）

- 対象 1: `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md` の R-2 欄
  - 追記内容: 本タスクで判定が確定した場合の出典 URL / verification-log パス
  - 本タスクは spec_created のため、追記は **検証実施タスクで行う旨を明記**
- 対象 2: docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md
  - 追記内容: 既存指示書の前提条件として本タスクの Gate A / Gate B と execution-001 の判定結果を参照
  - 状態: 指示書は存在。実 settings / alias 反映は verification / execution 判定まで blocked

## Task 12-3: documentation-changelog

- Step 1-A / 1-B / 1-C / Step 2 の各結果を個別ブロックで記録
- workflow-local 同期と global skill sync を別ブロックで記録

## Task 12-4: 未タスク検出

候補（0 件でも出力する）:

| 候補 | 出典 | 状態 |
| --- | --- | --- |
| 検証実施タスク（実 Claude Code 起動による検証） | 本タスクのスコープ外 | 別タスク化候補（実施承認後） |
| pre-commit hook で alias 整合 check | Phase 10 MINOR M-02 | 未タスク化候補 |
| MCP server permission の挙動検証（U4） | 上流タスク Phase 3 R-2 派生 | 別タスク化済み or 未作成 |
| project-local-first 比較設計（U3） | 上流タスク Phase 3 R-2 派生 | 別タスク化済み or 未作成 |

関連タスク差分確認: 既存の Claude Code 設定整備タスクと重複する場合は統合先 ID を記録。

検証実施タスクの正式化条件:
- 公式 docs に `permissions.deny` と `--dangerously-skip-permissions` の優先関係を明示する記述がない
- apply-001 が `--dangerously-skip-permissions` を維持する前提で進む
- ユーザーが実 Claude Code 起動による isolated 検証を承認する

上記を満たさない場合は、apply-001 は fail-closed として alias から `--dangerously-skip-permissions` を外す方針を採用する。

## Task 12-5: skill-feedback-report

観点:
- テンプレート改善: 「検証専用タスク（spec_created で完了する verification 系）」用テンプレが
  task-specification-creator にあると効率化できる
- ワークフロー改善: NON_VISUAL + 検証専用は Phase 6〜8 を軽量化（本タスクで実証）
- ドキュメント改善: isolated repo 検証 runbook を再利用可能 reference として切り出せる

## Task 12-6: compliance check

- `index.md` Phase 表 / `artifacts.json` / `outputs/artifacts.json` の三者同期確認
- `outputs/phase-12/` に 6 成果物が揃っているかの ls 突合
- identifier consistency check（pattern ID P-01〜P-04 / Risk ID R-1〜R-5 / TC ID の一致）

## よくある漏れチェック（本タスク特有）

- [ ] index.md / artifacts.json / outputs/artifacts.json の同一 wave 更新
- [ ] ledger 同期（該当する場合）
- [ ] documentation-changelog.md が全 Step を「該当なし」も含めて明記
- [ ] LOGS.md × 2 ファイル更新（該当する場合）
- [ ] NON_VISUAL 判定で `screenshots/.gitkeep` を削除（`screenshots/` 自体作らない）
- [ ] apply-001 が既存 completed-tasks 配下にあることを明記し、実反映未実施 / blocked の前提を補正

## 主成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [ ] 6 成果物が揃う
- [ ] artifacts.json の Phase 12 status が実行時状態（spec_created 時点では `pending`、完了時は `completed`）と同期
- [ ] Phase 13 はユーザー承認待ちで blocked

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 1〜11 全成果物
- Phase 7: `outputs/phase-7/main.md`
- Phase 8: `outputs/phase-8/main.md`
- Phase 9: `outputs/phase-9/main.md`
- Phase 10: `outputs/phase-10/final-review-result.md`
- Phase 11: `outputs/phase-11/main.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする
