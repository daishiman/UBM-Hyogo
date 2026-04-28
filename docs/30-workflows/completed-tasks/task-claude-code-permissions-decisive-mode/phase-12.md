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

Phase 11 までの成果物を 6 種類の Phase 12 canonical 成果物としてまとめ、システム仕様書（`docs/00-getting-started-manual/claude-code-config.md`）への階層優先順位追記方針を確定する。

## 必須 6 成果物

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
> 家のドアの鍵に、毎回「開けますか？」と聞いてくるロックがあるとします。本タスクでは、信頼できる家族（自分の作業環境）が出入りするときには確認を毎回求めない設定に統一し、毎回モードが勝手に戻ってしまう不具合を直します。

なぜ必要か:
- 起動するたびに確認が出ると作業が止まる
- 設定が階層で食い違うと、どの値が効いているか分からなくなる

何をするか:
- 3 つの設定ファイルの値を揃える
- 起動コマンドに「最初から確認を飛ばす」オプションを足す
- 「やっていいこと / ダメなこと」のリストを整備する

### Part 2（技術詳細）

- E-1: settings 階層の `defaultMode` 統一（案 A）
- E-2: `cc` エイリアスへ `--dangerously-skip-permissions` 併用
- E-3: `permissions.allow` / `deny` whitelist
- 階層優先順位:
  ```
  project/.claude/settings.local.json > project/.claude/settings.json
    > ~/.claude/settings.local.json > ~/.claude/settings.json
  ```
- 設定可能パラメータ: `defaultMode`, `permissions.allow`, `permissions.deny`
- エラーハンドリング: 不正値時の挙動は Phase 4 TC-F-01 を参照
- 視覚証跡: **UI/UX 変更なしのため Phase 11 スクリーンショット不要**。代替証跡は `outputs/phase-11/manual-smoke-log.md` と `outputs/phase-10/final-review-result.md`

## Task 12-2: システム仕様更新

### Step 1-A: タスク完了記録

- 「完了タスク」セクションへ本タスク行を追加
- LOGS.md × 2（aiworkflow-requirements / task-specification-creator）に同波更新（該当する場合）
- topic-map.md にエントリ追加（該当する場合）

### Step 1-B: 実装状況テーブル

- 本タスクのステータス: `spec_created`（実装は別タスクのため `completed` ではない）

### Step 1-C: 関連タスクテーブル

- 別タスク化される実装タスクの ID を記載

### Step 2: システム仕様更新（条件付き）

- 対象: `docs/00-getting-started-manual/claude-code-config.md`
- 追記内容: settings 階層優先順位、`--dangerously-skip-permissions` 併用方針、whitelist 例
- 新規インターフェース追加なし。**ただし運用ルールの変更があるため Step 2 は実施対象**

## Task 12-3: documentation-changelog

- Step 1-A / 1-B / 1-C / Step 2 の各結果を個別ブロックで記録
- workflow-local 同期と global skill sync を別ブロックで記録（[Feedback BEFORE-QUIT-003]）

## Task 12-4: 未タスク検出

候補（0 件でも出力する）:

| 候補 | 出典 | 状態 |
| --- | --- | --- |
| 実装タスク（実 settings 書き換え） | 本タスクのスコープ外 | 別タスク化必須 |
| pre-commit hook で alias 整合 check | Phase 10 MINOR | 未タスク化候補 |
| MCP server permission の挙動検証 | Phase 3 R-2 残存リスク | 未タスク化候補 |

関連タスク差分確認: 既存の Claude Code 設定整備タスクと重複する場合は統合先 ID を記録。

## Task 12-5: skill-feedback-report

観点:
- テンプレート改善: 「設定ファイル変更タスク」専用のテストパターン定型化候補
- ワークフロー改善: NON_VISUAL + 設定変更タスクは Phase 6〜8 を軽量化できる可能性
- ドキュメント改善: 階層優先順位を再利用可能な reference として切り出し

## Task 12-6: compliance check

- `index.md` Phase 表 / `artifacts.json` / `outputs/artifacts.json` の三者同期確認
- `outputs/phase-12/` に 6 成果物が揃っているかの ls 突合
- identifier consistency check（実装と設計書のキー名一致）

## よくある漏れチェック（本タスク特有）

- [ ] **[Feedback 5]** index.md / artifacts.json / outputs/artifacts.json の同一 wave 更新
- [ ] **[FB-04]** ledger 同期 5 ファイル
- [ ] documentation-changelog.md が全 Step を「該当なし」も含めて明記
- [ ] LOGS.md × 2 ファイル更新
- [ ] NON_VISUAL 判定で `screenshots/.gitkeep` を削除（`screenshots/` 自体作らない）

## 主成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [ ] skill 準拠の完了条件を満たす。
- 6 成果物が揃う
- artifacts.json が `phase12_completed` で同期
- Phase 13 はユーザー承認待ちで blocked

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 1: `outputs/phase-1/` を参照する。
- Phase 2: `outputs/phase-2/` を参照する。
- Phase 5: `outputs/phase-5/` を参照する。
- Phase 6: `outputs/phase-6/` を参照する。
- Phase 7: `outputs/phase-7/` を参照する。
- Phase 8: `outputs/phase-8/` を参照する。
- Phase 9: `outputs/phase-9/` を参照する。
- Phase 10: `outputs/phase-10/` を参照する。
- Phase 11: `outputs/phase-11/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。
