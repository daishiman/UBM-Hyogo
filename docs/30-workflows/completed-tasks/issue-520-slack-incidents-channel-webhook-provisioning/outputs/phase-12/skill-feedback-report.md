# Skill Feedback Report

## テンプレ改善

NON_VISUAL secret provisioning tasks need an explicit pattern where Phase 12 spec completeness can PASS while Phase 11 external SaaS evidence remains pending. Issue #520 records this as `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`.

## ワークフロー改善

G1〜G4 should map separately to Slack channel/webhook creation, 1Password + staging secret placement, production placement after staging smoke, and production smoke + redaction evidence. Combined approval is not acceptable.

## ドキュメント改善

`observability-monitoring.md` owns channel and smoke evidence semantics. `deployment-secrets-management.md` owns secret placement and op:// rules. Keeping that split prevents duplicated canonical text.

## Routing

| Item | Routing | Evidence |
| --- | --- | --- |
| NON_VISUAL secret provisioning boundary | task-specification-creator changelog | `.claude/skills/task-specification-creator/SKILL-changelog.md` |
| Channel / smoke evidence contract | aiworkflow-requirements reference | `observability-monitoring.md` |
| Secret placement contract | aiworkflow-requirements reference | `deployment-secrets-management.md` |
