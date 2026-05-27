# System Spec Update Summary

## Updated

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Issue #275 workflow / implementation / evidence を 06b login/profile 近傍へ登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 06b quick reference の remaining follow-up を resolved entry へ更新 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 06b active row の Magic Link 429 follow-up を implemented_local_evidence_captured として同期 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-275-magic-link-429-retry-after-artifact-inventory.md` | Artifact inventory を新規作成 |
| `docs/30-workflows/unassigned-task/UT-06B-MAGIC-LINK-RETRY-AFTER.md` | consumed pointer として本 workflow へ接続 |

## Not Updated

Manual specs `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md` は auth flow 自体を変えないため更新なし。API contract は既存 `Retry-After` header/body 実装を利用し、API 側コード変更なし。
