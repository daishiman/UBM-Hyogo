# Phase 12: ドキュメント・未タスク・スキルフィードバック

task-specification-creator skill の Phase 12 必須 5 タスク + compliance check（合計 7 ファイル）を実施する。

## Task 12-1: implementation-guide.md（Part 1 中学生レベル + Part 2 技術者レベル）

`outputs/phase-12/implementation-guide.md`

- Part 1: 「テストがどれくらいコードを通っているかを地図にして、次にどこを通すかを 5〜10 件のリストにまとめる」を中学生レベルで説明
- Part 2: layer 集計テンプレート / gap マッピングスキーマ / wave-3 候補リストの作り方 / aiworkflow references 反映 / `pnpm indexes:rebuild` 連携を技術者レベルで記述

## Task 12-2: システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）

`outputs/phase-12/system-spec-update-summary.md`

- Step 1-A: 親 workflow `docs/30-workflows/ut-coverage-2026-05-wave/README.md` に wave-3 roadmap への link 追加
- Step 1-B: `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md` の状態欄を「未実施」→「仕様書化済（issue-433-ut-web-cov-05-wave3-roadmap）」へ更新（**ファイル削除・移動はしない**、状態欄追記のみ）
- Step 1-C: aiworkflow-requirements references（artifact inventory / task-workflow-active）の最新化を Phase 10 で実施済として記録
- Step 2: drift があれば aiworkflow-requirements を SSOT に戻す

## Task 12-3: documentation-changelog.md

`outputs/phase-12/documentation-changelog.md`

- `wave-3-roadmap.md` 新規 / 2 references 編集 / indexes 再生成 / 元 unassigned-task spec の状態欄追記 を時系列でリスト化

## Task 12-4: unassigned-task-detection.md（0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md`

候補:

- coverage threshold 引き上げ policy 議論（scope out のため別タスク）
- wave-3 各候補タスクの実装着手（本仕様書 scope out、wave-3 で個別 spec 化）
- coverage 集計の自動化スクリプト（手作業 layer mapping を script 化）

該当ありの場合は backlog 切り出しの根拠を明示。`coverage 型タスクは coverage layer 表 (file/before%/after%/delta%) で代替可能` のルールを適用し、layer 表を引用する。

## Task 12-5: skill-feedback-report.md（改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md`

3 観点固定:

- テンプレ改善: NON_VISUAL roadmap タスクの Phase 11 evidence テンプレ汎用化（`verify-indexes-current` / `link-check` の 2 点セット。CI 未実行時は `PENDING_CI_EVIDENCE`）
- ワークフロー改善: wave 横断の coverage gap 集約レイヤーを正規プロセスに昇格する手順
- ドキュメント改善: aiworkflow-requirements references への `wave-3 計画` 見出し導入

なしの場合は「改善点なし」と明示。

## Task 12-6: phase12-task-spec-compliance-check.md

`outputs/phase-12/phase12-task-spec-compliance-check.md`

7 ファイル実体チェック:

```bash
for f in implementation-guide.md system-spec-update-summary.md documentation-changelog.md \
         unassigned-task-detection.md skill-feedback-report.md \
         phase12-task-spec-compliance-check.md main.md; do
  test -f "docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-12/$f" \
    && echo "PASS: $f" || echo "FAIL: $f"
done
```

加えて以下の compliance を記録:

- AC-1〜5 と Phase 出力の 1:1 対応
- 元 unassigned-task spec が削除・移動されていないこと（`test -f docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md`）
- workflow_state は `spec_created` 据え置き（Phase 13 で実装着手・PR 承認後に `completed` 昇格）
- root `artifacts.json` と `outputs/artifacts.json` が一致していること

## workflow_state 取扱

`spec_created` 状態のため workflow root の `metadata.workflow_state` は据え置き、`phases[].status` のみ更新。実装完了時に `completed` へ昇格。

## 変更対象ファイル一覧（CONST_005）

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md | 編集 | 状態欄に追記のみ。削除・移動禁止 |
| outputs/phase-12/* | 新規 | 7 ファイル |
| outputs/artifacts.json | 新規 | root artifacts parity |

## 入力 / 出力 / 副作用

- 入力: 全 Phase 1〜11 の outputs
- 出力: outputs/phase-12 配下 7 ファイル + 元 unassigned-task spec への状態欄追記
- 副作用: 元 unassigned-task spec のみ markdown 編集（追記のみ）

## テスト方針

- 7 ファイル実体チェック PASS
- 元 unassigned-task spec の存在チェック PASS
- AC-1〜5 が implementation-guide.md でトレースされる

## 完了条件 / DoD

- [ ] 7 ファイルすべて outputs/phase-12 に存在
- [ ] 元 unassigned-task spec を削除・移動していない
- [ ] AC-1〜5 が implementation-guide.md でトレース済
- [ ] workflow_state を `spec_created` 据え置き

## 出力

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## 参照資料

- .claude/skills/task-specification-creator/references/phase-12-spec.md
- .claude/skills/task-specification-creator/references/phase-12-pitfalls.md
- docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md

## 目的

Phase 12 strict outputs と system-spec sync を完了し、仕様書としての close-out を検証する。

## メタ情報

- Phase: 12
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- Phase 12 strict 7 files、unassigned task preservation、artifacts parity を確認する。

## 成果物/実行手順

- `outputs/phase-12/` に 7 ファイルを作成し、root/outputs artifacts parity を確認する。

## 統合テスト連携

- NON_VISUAL。`validate-phase-output` と aiworkflow structure validation を実行する。
