# System Spec Update Summary

Updated canonical requirements:

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
  - Added Issue #762 OIDC future supported path gate.
  - Recorded pre-support hardening files.
  - Fixed G1-G4 sequence for future real OIDC cutover.

Updated source task trace:

- `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md`
  - Changed status from `blocked` to `partially_consumed`.
  - Added `canonical_workflow` pointer to Issue #762.
  - Listed consumed hardening items and remaining blocked OIDC cutover work.

No runtime secret, Cloudflare trust policy, GitHub secret, or 1Password mutation was executed.
