# Documentation Changelog

## Added

| File | Summary |
| --- | --- |
| `outputs/phase-12/implementation-guide.md` | 中学生レベル説明と技術者向け runtime contract を追加 |
| `outputs/phase-12/system-spec-update-summary.md` | same-wave sync と runtime smoke 後 pending を分離 |
| `outputs/phase-12/documentation-changelog.md` | 本 changelog |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出結果を 0 件でも明示 |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback routing を記録 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 7成果物の実体確認を記録 |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-06a-A-public-web-real-workers-d1-smoke-execution-artifact-inventory.md` | workflow artifact inventory を追加 |

## Updated

| File | Summary |
| --- | --- |
| `artifacts.json` | `task_path` を current root に修正し、Phase 12 outputs を 7 ファイルへ展開 |
| `index.md` | Phase 12 outputs と aiworkflow sync 状態を追記 |
| `outputs/phase-12/main.md` | placeholder から Phase 12 index に置換 |
| `phase-13.md` | commit / PR / code change の自走禁止境界を spec-only に縮約 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current workflow inventory に登録 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active task として登録 |
| `.claude/skills/task-specification-creator/scripts/validate-phase-output.js` | `classifyVisualEvidence` 正規表現に `VISUAL_ON_EXECUTION` / `VISUAL_DEFERRED` を追加し Phase 11 pre-execution screenshot 誤検出を解消 |
| `.claude/skills/task-specification-creator/references/task-type-decision.md` | `VISUAL_ON_EXECUTION` の運用ルールを追記し validator 分類と整合 |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴に v2026.05.02-06a-a-visual-on-execution-classifier を追加 |
| `.claude/skills/task-specification-creator/changelog/20260502-06a-A-visual-on-execution-classifier.md` | 本 sync エントリを新規追加 |

## Issue Notation

Issue #273 は CLOSED のまま扱う。関連 PR / changelog では `Refs #273` のみ使用し、`Closes #273` は使用しない。

