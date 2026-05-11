# Skill Feedback Report — Issue #587

## テンプレ改善

- artifact rotation を「candidate / canary / promotion / rollback の 4 段」テンプレ化する提案。`task-specification-creator/references/phase-templates.md` の派生テンプレ候補。
- canary workflow（`workflow_dispatch` + op 参照 input）の Phase 5/6 テンプレ化。次世代 artifact 投入の他コンポーネント（schema model / RAG index 等）にも横展開可能。

## ワークフロー改善

- candidate path の op vault lifecycle（PROD → PREVIOUS への自動退避）の構造化。promotion 直前の `op item edit` を script 化する案（FU-02-D で formalize）。
- rotation evidence canonical path 予約フォーマット（`phase11-evidence-canonical-paths.json`）を親 #549 FU-04 と統合する案。

## ドキュメント改善

- aiworkflow-requirements `observability-monitoring.md` に「rotation の 4 段」セクションを追加し、本タスク #587 と親 #549 の関係をリンク。
- forward-safe rollback の「D1 列を消さない」原則を rotation でも継続することを `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` 冒頭の不変条件に追記。

本サイクルでは上記すべて改善提案あり。「改善提案なし」章はない。

## Step 1-H promotion / defer / reject 判定

| item | 判定 | 反映先 / 起票先 |
| --- | --- | --- |
| 4 段 rotation テンプレ化 | promote | `.claude/skills/task-specification-creator/references/phase-templates.md`（実反映は別タスク） |
| canary workflow テンプレ化 | promote | 同上 |
| op vault lifecycle 構造化 | defer | `docs/30-workflows/unassigned-task/` へ formalize（FU-02-D） |
| canonical path 予約 | defer | 親 #549 FU-04 と統合 |
| observability-monitoring 追記 | promote（same-wave） | system-spec-update-summary.md Step 2 で反映 |
| forward-safe rollback 不変条件追記 | promote（same-wave） | `15-infrastructure-runbook.md` 冒頭 |
