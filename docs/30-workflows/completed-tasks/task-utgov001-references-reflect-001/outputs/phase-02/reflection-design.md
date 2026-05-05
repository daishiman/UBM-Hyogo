# Phase 2 Output: Reflection Design

## Flow

1. Fresh GET: `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection`
2. Evidence validation: `required_status_checks.contexts` と6軸状態を確認
3. aiworkflow-requirements update: references → indexes → workflow ledger
4. Mirror check: `.claude` と `.agents` の差分確認

## Reflection Targets

| Target | Role |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch protection current applied state |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | quick lookup |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | task ledger |
