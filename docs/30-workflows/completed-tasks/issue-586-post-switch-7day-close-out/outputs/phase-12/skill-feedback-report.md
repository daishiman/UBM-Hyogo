# Skill Feedback Report

## テンプレ改善

- 「N 日 close-out + `pass_runtime_synced` 昇格」を Phase 11 NON_VISUAL evidence matrix の 2 段 evidence テンプレ化する提案
- workflow YAML への `vars.<KEY>` + `secrets.<KEY>` + `permissions:` の最小 set を Phase 5/6 テンプレに「production env block 必須」セクション化する提案

## ワークフロー改善

- artifact upload `retention-days` を Phase 3/5 設計テンプレに「観測ウィンドウ + 1 日マージン」を default 化する案
- `peter-evans/create-pull-request@v6` で evidence を別 PR 起票するパターンを Phase 11 / Phase 13 に汎用テンプレ化する案
- 追加: `actions/download-artifact@v4` は same-run 限定なので、cross-run aggregation には `gh api workflows/<name>/runs` + `gh api .../artifacts/<id>/zip` 経由の手書き download を推奨パターンとする

## ドキュメント改善

- aiworkflow-requirements の `observability-monitoring.md` に「N 日 close-out evidence canonical path」セクションを新設（本サイクルで §11.1 に着地）
- `task-workflow-active.md` の状態語彙に `pass_boundary_synced_runtime_pending` → `pass_runtime_synced` の昇格条件を構造化（本サイクルで Issue #549 entry 内に着地）

## Step 1-H promotion / defer / reject

| item | 判定 | 反映先 |
| --- | --- | --- |
| 2 段 evidence テンプレ化 | promote（same-wave） | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| `vars` + `secrets` + `permissions` 必須化 | promote（same-wave 部分反映） | `phase-template-phase11.md` の N日 close-out matrix + 本 task workflow contract |
| `retention-days` default 化 | promote（same-wave） | `phase-template-phase11.md` |
| evidence 別 PR 起票テンプレ | promote（same-wave） | `phase-template-phase11.md` |
| cross-run download パターン | promote（same-wave） | `phase-template-phase11.md` / `phase-12-documentation-guide.md` |
| observability-monitoring §11.1 追記 | promote（same-wave） | 本サイクルで反映済 |
| `task-workflow-active` 3 段昇格構造化 | promote（same-wave） | 本サイクルで反映済 |
