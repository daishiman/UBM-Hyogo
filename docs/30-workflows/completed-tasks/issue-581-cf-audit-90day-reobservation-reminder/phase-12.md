# Phase 12: 正本同期 / 未タスク検出

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 12 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

Phase 11 の Gate 判定結果を正本（aiworkflow-requirements / task-workflow-active）と未タスク（unassigned-task）に同期し、後続作業を canonical 化する。

## strict 7 outputs

`outputs/phase-12/` 配下に以下 7 ファイルを配置する（task-specification-creator Phase 12 strict 7 出力）:

| # | file | 内容 |
| --- | --- | --- |
| 1 | `main.md` | Phase 12 実行サマリと strict 7 index |
| 2 | `implementation-guide.md` | 中学生レベル説明 + 技術者向け実行ガイド |
| 3 | `system-spec-update-summary.md` | aiworkflow-requirements 同期対象（artifact-inventory / lessons-learned / task-workflow-active / observability）の差分 |
| 4 | `documentation-changelog.md` | 変更履歴（実ファイル、コマンド、件数） |
| 5 | `unassigned-task-detection.md` | 後続未タスクの要否判定。Gate-B FAIL → baseline-recalibration、Gate-C PASS かつ Gate-A/B PASS → ml-comparison-ready の未タスク化条件 |
| 6 | `skill-feedback-report.md` | テンプレ改善 / ワークフロー改善 / ドキュメント改善の3観点 |
| 7 | `phase12-task-spec-compliance-check.md` | Phase 1-13 が task-specification-creator skill 仕様に準拠しているかのセルフチェック |

## 同期対象（aiworkflow-requirements）

| 対象 file | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #581 canonical workflow row 追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-546-cf-audit-logs-90day-baseline-observation-artifact-inventory.md` | 本 cycle の evidence 追記（read-only 参照） |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-546-cf-audit-logs-90day-baseline-observation-2026-05.md` | 今回 cycle の lessons 差分追記 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Issue #581 reminder boundary / watchdog HOLD lifecycle marker 追記 |
| `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map}.md` | discoverability / generated topic offsets 更新 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | generated keyword index 更新 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 2026-05-09 sync entry 追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260509-issue581-cf-audit-90day-reobservation-reminder.md` | changelog fragment 追加 |
| `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | HOLD / deleted workflow lifecycle marker と P-1 early termination evidence rule を昇格 |
| `.claude/skills/task-specification-creator/SKILL-changelog.md` | Issue #581 skill feedback promotion entry 追加 |

> 仕様作成 cycle の正本登録は Phase 13 後へ延期しない。Phase 13 の user approval gate は commit / push / PR と、2026-08-05 以後の runtime 再観測実行に限定する。

## 後続未タスク条件

| 条件 | 未タスク化要否 | 配置先 |
| --- | --- | --- |
| Gate-A FAIL（monitor / watchdog 修復が必要） | YES（既存タスクが無い場合のみ） | `docs/30-workflows/unassigned-task/` |
| Gate-B FAIL（baseline recalibration） | YES | 同上 |
| Gate-B PENDING（D1 readiness 待ち） | 既存 reminder 更新で対応 | `unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md` 更新 |
| Gate-C PASS かつ A/B PASS（ML 移行準備） | YES | 同上 |
| 全 PASS かつ ML 移行不要判断 | NO | 終了 |

## 完了条件

- [ ] `outputs/phase-12/` に strict 7 outputs が全件存在
- [ ] aiworkflow-requirements 同期が実ファイルへ反映されている
- [ ] 後続未タスク条件が判定基準とともに記録されている

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`
- `.claude/skills/task-specification-creator/references/unassigned-task-workflow-integration.md`
