# System Spec Update Summary

Updated system-facing specs:

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`: Issue #571 staging runtime smoke section now points to `scripts/smoke/provision-staging-secrets.sh` as the canonical provisioning path.
- `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/phase-11.md`: G1 setup now delegates to the script and remains `pending user approval` until actual environment mutation evidence exists.
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` and `references/task-workflow-active.md`: this workflow is registered as implemented-local runtime-pending.

No secret value, value hash, token fragment, or webhook URL was added to docs.
