# System Spec Update Summary

## 判定

Step2 該当。runtime smoke の bearer lifecycle / reason vocabulary / GitHub Environment secret 運用が正本仕様に影響する。

## 同期先

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `staging-runtime-smoke` の auth freshness gate / mint secret invariant |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 workflow の local implementation state |
| `.claude/skills/aiworkflow-requirements/references/workflow-runtime-smoke-staging-mint-recurrence-fix-artifact-inventory.md` | artifact inventory |

## 境界

GitHub secret 実投入、Cloudflare secret mutation、runtime workflow rerun、commit、push、PR は user-gated。
