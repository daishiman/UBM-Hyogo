# Phase 12 Output: Documentation Changelog

## This Wave

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-30 | 新規 | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` | Phase 1-13, `index.md`, root/output `artifacts.json`, outputs を作成 |
| 2026-04-30 | 同期 | `docs/30-workflows/LOGS.md` | UT-GOV-001 second-stage reapply 仕様書化完了行 |
| 2026-04-30 | 同期 | `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル更新 |
| 2026-04-30 | 同期 | `.claude/skills/task-specification-creator/SKILL.md` | approval-gated NON_VISUAL implementation 事例を追記 |
| 2026-04-30 | 同期 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory に second-stage reapply 行を追加 |
| 2026-04-30 | 同期 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | second-stage reapply 早見を追加 |
| 2026-04-30 | 同期 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow と Phase 13 approval gate を追加 |
| 2026-04-30 | 同期 | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | aiworkflow 側 headline log を追加 |
| 2026-04-30 | スキル更新 | `.claude/skills/task-specification-creator/references/{quality-gates,phase-12-spec,spec-update-workflow,phase-11-non-visual-alternative-evidence}.md` | placeholder evidence と runtime evidence の分離、Phase 13 approval gate、外部 GET 正本ルールを追加 |
| 2026-04-30 | スキル更新 | `.claude/skills/skill-creator/references/update-process.md` | skill-feedback を実スキル更新候補へ昇格する Phase 3.8 を追加 |

## Phase 13 After Approval

| タイミング | 対象 | 変更概要 |
| --- | --- | --- |
| Phase 13 後 | `outputs/phase-13/branch-protection-current-{dev,main}.json` | fresh GET evidence として保存 |
| Phase 13 後 | `outputs/phase-13/branch-protection-payload-{dev,main}.json` | 適用前 GET 由来の完全 payload として再生成 |
| Phase 13 後 | `outputs/phase-13/branch-protection-applied-{dev,main}.json` | PUT 後の applied GET evidence として保存 |
| Phase 13 後 | `outputs/phase-09/drift-check.md` | actual GET と文書の 6 値比較を実測値へ更新 |
| Phase 13 後 | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` | 実 PUT + PR merged 後に completed-tasks へ移動候補 |

## Separate Tasks

| 別タスク | 対象 | 理由 |
| --- | --- | --- |
| `task-utgov001-references-reflect-001` | aiworkflow-requirements references final state | applied GET evidence がない状態で final branch protection state を推測反映しない |
| `task-utgov001-drift-fix-001` | CLAUDE.md / deployment branch strategy drift | drift 検出時のみ発火 |
| `task-utgov-downstream-precondition-link-001` | UT-GOV-005〜007 | contexts 強制済み protected dev/main を downstream 前提へ反映 |
