# System Spec Update Summary

## Updated Canonical Files

| File | Update |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Added Issue #717 conditional no-code verification note. Current web-cd secret remains `CLOUDFLARE_API_TOKEN` until official OIDC support exists. |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | Added Issue #717 no-code current fact so GitHub Actions deploy docs do not imply supported OIDC deploy is current. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added Issue #717 row with `verified_current_no_code_change_pending_pr`. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added quick lookup row for Issue #717. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added workflow inventory row for Issue #717. |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-717-oidc-cf-full-migration-artifact-inventory.md` | Added artifact inventory. |
| `.claude/skills/aiworkflow-requirements/changelog/20260516-issue717-oidc-support-revalidation.md` | Added changelog entry. |
| `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | Promoted unsupported conditional implementation stale-claim gate. |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` / `docs/30-workflows/LOGS.md` | Added same-wave log. |

## Step 1-A: Completed Task Record

Issue #717 is not marked implementation-completed. It is recorded as a conditional verification package: current baseline is verified, no code change is safe until Cloudflare documents a supported OIDC deploy path.

## Step 1-B: Implementation Status Table

| Capability | State |
|---|---|
| Issue #640 step-scoped token boundary | current runtime contract |
| Issue #717 Cloudflare Workers OIDC deploy | verified current no-code change / conditional |
| Production OIDC cutover | blocked follow-up |
| Legacy token physical revocation | blocked by production cutover + observation |

## Step 1-C: Related Task Table

| Task | Relation |
|---|---|
| `issue-640-oidc-cf-token-cutover` | Upstream current contract. |
| `issue-717-followup-001-production-oidc-cutover` | Future official-support revalidation, staging proof, and production cutover. |
| `issue-717-followup-002-apps-api-d1-token-cutover` | Separate app/API deploy credential layer. |
| `issue-717-followup-003-1password-restructure` | Final cleanup after production cutover and legacy revocation. |

## Step 2: Interface / Secret Boundary

No new runtime secret, API, workflow permission, or Cloudflare principal is introduced in this cycle. `CLOUDFLARE_API_TOKEN` remains current for web-cd and must not be removed until a supported OIDC replacement has passed staging and production observation.
