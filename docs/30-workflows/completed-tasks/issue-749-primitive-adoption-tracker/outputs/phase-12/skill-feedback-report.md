# Skill Feedback Report — Issue #749

## task-specification-creator skill への feedback

### 良かった点

- Phase 1-13 構造が umbrella tracking タスク（採用追跡）にもそのまま流用できた
- Phase 7（CI gate）と Phase 10（governance read-only）の分離設計が、PUT 操作を user-gated に保つのに有効
- Phase 12 の 7 outputs 必須化により、`spec_verified` 昇格条件が機械的に判定可能

### 改善提案と routing

| feedback | routing | promotion target | no-op reason | evidence path |
| --- | --- | --- | --- | --- |
| N routes × M primitive matrix | workflow-local | none | 今回は `outputs/adoption-tracker.md` と C1-C6 grep gate で十分。再利用 2 件以上で template 化する。 | `outputs/adoption-tracker.md` |
| 実使用 gate（placeholder import 禁止） | promoted | `.claude/skills/task-specification-creator/SKILL.md` 履歴 | no-op ではない。Issue #749 の review feedback として同 wave 反映済み。 | `.claude/skills/task-specification-creator/SKILL-changelog.md` |
| grep gate script の置き場所 | no-op | none | 既存 repo は `scripts/verify-*` を使っており、同階層が最小整合。 | `scripts/verify-primitive-adoption.sh` |

## aiworkflow-requirements skill への feedback

| feedback | routing | promotion target | no-op reason | evidence path |
| --- | --- | --- | --- | --- |
| 19 routes 定義の SCOPE 集約 | completed sync | quick-reference / resource-map / task-workflow-active | no-op ではない。同一 cycle で同期済み。 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` |
| adoption-tracker matrix template | no-op | none | workflow-local 実体で足りる。全体 template 化は再利用実績待ち。 | `outputs/adoption-tracker.md` |

## LOGS / changelog 更新

この repository では該当 skill の履歴は `LOGS/_legacy.md` と `changelog/` fragment に分かれているため、同一サイクルで以下を更新する:

- `.claude/skills/aiworkflow-requirements/changelog/20260517-issue749-primitive-adoption-tracker.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- `.claude/skills/task-specification-creator/SKILL-changelog.md`
- `.claude/skills/task-specification-creator/LOGS/_legacy.md`
