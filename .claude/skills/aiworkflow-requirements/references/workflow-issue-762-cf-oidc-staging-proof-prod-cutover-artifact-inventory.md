# Workflow Artifact Inventory: Issue #762 CF OIDC Staging Proof / Production Cutover Readiness

Status: implemented_local_evidence_captured / implementation / NON_VISUAL / user-gated PR

Canonical workflow:

- `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/index.md`
- `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/artifacts.json`
- `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/artifacts.json`
- `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/phase-11/`
- `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/phase-12/phase12-task-spec-compliance-check.md`

Implementation targets:

- `scripts/oidc/verify-claim-pin.sh`
- `scripts/oidc/__tests__/verify-claim-pin.spec.sh`
- `scripts/redaction-check.sh`
- `scripts/__tests__/redaction-check.test.sh`
- `.github/workflows/oidc-observation-window.yml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md`

User-gated:

- commit, push, PR creation
- Cloudflare trust policy mutation
- GitHub Secret mutation
- 1Password mutation
