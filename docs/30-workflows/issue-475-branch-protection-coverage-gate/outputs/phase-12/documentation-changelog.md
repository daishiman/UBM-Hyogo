# Documentation Changelog — Issue #475

| 日付 | ファイル | 変更内容 |
| --- | --- | --- |
| 2026-05-05 | `docs/30-workflows/issue-475-branch-protection-coverage-gate/index.md` | 新規（タスク仕様書 root） |
| 2026-05-05 | `docs/30-workflows/issue-475-branch-protection-coverage-gate/artifacts.json` | 新規（Phase 1-13 状態管理） |
| 2026-05-05 | `docs/30-workflows/issue-475-branch-protection-coverage-gate/outputs/phase-{1..13}/*.md` | 新規（Phase 1-13 仕様書） |
| 2026-05-05 | `outputs/phase-12/main.md` | 新規 |
| 2026-05-05 | `outputs/phase-12/implementation-guide.md` | 新規 |
| 2026-05-05 | `outputs/phase-12/documentation-changelog.md` | 新規（本ファイル） |
| 2026-05-05 | `outputs/phase-12/unassigned-task-detection.md` | 新規 |
| 2026-05-05 | `outputs/phase-12/skill-feedback-report.md` | 新規 |
| 2026-05-05 | `outputs/phase-12/system-spec-update-summary.md` | 新規 |
| 2026-05-05 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 |
| 2026-05-05 | `docs/30-workflows/issue-475-branch-protection-coverage-gate/{artifacts.json,outputs/artifacts.json,index.md}` | Gate A 外部適用観測後の状態へ同期（`runtime_evidence_captured_gate_b_pending`） |
| 2026-05-05 | `.claude/skills/aiworkflow-requirements/{SKILL.md,indexes/*,references/task-workflow-active.md}` | Issue #475 適用済み fresh GET evidence / Gate B pending 境界へ同期 |

## Gate A evidence 取得後の追加更新

| 予定日 | ファイル | 変更内容 |
| --- | --- | --- |
| 2026-05-05 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | current applied 表に main / dev の `coverage-gate` を反映、適用日と Issue #475 参照を併記 |
| 2026-05-05 | `.claude/skills/aiworkflow-requirements/indexes/*` | Issue #475 適用済み状態へ同期。`pnpm indexes:rebuild` drift 確認は最終検証で再実行 |

## 関連参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/475
- unassigned-task: `docs/30-workflows/unassigned-task/task-ci-test-recovery-coverage-80-task-e-branch-protection-coverage-gate-001.md`
- 親 wave: `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/`
