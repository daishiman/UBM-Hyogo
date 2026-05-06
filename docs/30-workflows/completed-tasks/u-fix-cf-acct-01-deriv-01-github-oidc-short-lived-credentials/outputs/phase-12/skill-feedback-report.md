# Skill Feedback Report

## Template Improvements

| Item | Recommendation | Promotion Target | Evidence Path |
| --- | --- | --- | --- |
| OIDC deploy auth tasks | Add a canonical matrix for provider, workflow inventory, evidence count, and approval gates to prevent phase drift | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | `.claude/skills/task-specification-creator/SKILL.md` changelog |

## Workflow Improvements

| Item | Recommendation | Promotion Target | Evidence Path |
| --- | --- | --- | --- |
| approval gate vocabulary | Reserve G1-G4 names for a single meaning across all phases; commit/push/PR approval should be named separately when it is not part of runtime cutover | `phase-template-phase11.md` OIDC matrix | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Documentation Improvements

| Item | Recommendation | Promotion Target | Evidence Path |
| --- | --- | --- | --- |
| aiworkflow-requirements | Record `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_API_TOKEN_STAGING` as normal-current only until DERIV-01 runtime completion; mark OIDC as target contract, not completed current fact | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `outputs/phase-12/system-spec-update-summary.md` |
