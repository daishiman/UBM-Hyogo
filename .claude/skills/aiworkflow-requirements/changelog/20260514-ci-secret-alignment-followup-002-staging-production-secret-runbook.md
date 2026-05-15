# 2026-05-14 CI Secret Alignment Followup-002 Staging / Production Secret Runbook

## Summary

Synchronized the staging / production web-cd Environment Secret provisioning runbooks and corrected stale GitHub CLI stdin guidance discovered during close-out review.

## Updated Canonical References

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`

## Workflow Artifacts

- `docs/30-workflows/ci-secret-alignment-followup-002-staging-production-secret-runbook/`
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md`
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md`
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`
- `scripts/smoke/provision-staging-secrets.sh`

## Boundary

Secret mutation, Cloudflare token issuance/revoke, deploy run, commit, push, and PR are user-gated. This wave completed documentation, reference sync, static evidence, and helper stdin contract correction only.
