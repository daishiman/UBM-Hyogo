# system spec update summary

| 項目 | 値 |
|------|------|
| 対象 spec | aiworkflow-requirements branch protection / workflow ledgers |
| 影響 | branch protection の required contexts が user approval 後に 5 → 8 件へ増加済み |

## 更新が必要な spec

| ファイル | 更新内容 |
|---------|----------|
| `.claude/skills/aiworkflow-requirements/references/branch-protection.md` | required status check に実測 context `visual-full ({desktop,tablet,mobile})` を追記 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | task-761 active workflow と branch protection mutation completed 境界を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | task-761 quick lookup row を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | visual-full required-check promotion row を追記 |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-761-visual-full-required-status-check-artifact-inventory.md` | artifact inventory を新設 |
| `.claude/skills/aiworkflow-requirements/changelog/20260517-task-761-visual-full-required-status-check.md` | 同一 wave の同期履歴を新設 |
| `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` | source task を `status: consumed` として canonical root へ接続 |

## 更新が不要な spec

- `docs/00-getting-started-manual/specs/*.md` (UI / API / DB に影響なし)
- `docs/00-getting-started-manual/specs/*.md` (UI / API / DB に影響なし)

## 更新タイミング

本 wave で aiworkflow 正本は `implemented / external_mutation_completed` として同期済み。`CLAUDE.md` の更新は不要で、commit / push / PR はユーザー指示まで未実行。
