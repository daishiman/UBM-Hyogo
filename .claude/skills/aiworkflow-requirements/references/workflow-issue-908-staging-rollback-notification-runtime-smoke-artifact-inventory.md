# Workflow Artifact Inventory — issue-908-staging-rollback-notification-runtime-smoke

## Summary

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-908-staging-rollback-notification-runtime-smoke/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| parent | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/` |
| purpose | Capture staging runtime evidence for schema alias rollback notification without marking runtime delivery complete before user-gated execution. |

## Local Artifacts

| Path | Role |
| --- | --- |
| `scripts/runtime-smoke/schema-alias-rollback.sh` | Dry-run capable, alias-validating, HTTP-status-recording, redacting, user-gated helper for staging rollback notification smoke |
| `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md` | Parent evidence placeholder for S-sent / S-skipped / S-failed runtime results |
| `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md` | Parent Phase 11 cross-link, still runtime pending |
| `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/artifacts.json` | Parent Gate-C evidence path changed from unassigned task to real placeholder, status still pending |

## User-Gated Runtime Artifacts

| Artifact | Gate |
| --- | --- |
| staging deploy confirmation | user approval |
| rollback POST / D1 staging mutation | user approval |
| S-sent / S-skipped / S-failed populated evidence rows | user approval |
| parent Phase 11 / Gate-C promotion to passed | after populated runtime evidence |
| commit / push / PR | user approval |

## Skill Sync

- task-specification-creator: `references/patterns-runtime-evidence-followup.md`
- aiworkflow-requirements: task-workflow-active, quick-reference, resource-map, changelog, LOGS, this inventory
