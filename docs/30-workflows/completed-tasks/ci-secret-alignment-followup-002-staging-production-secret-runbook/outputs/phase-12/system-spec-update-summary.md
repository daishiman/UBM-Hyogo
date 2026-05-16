# System Spec Update Summary

## Step 1-A: Current Canonical Facts

| Area | Current Fact |
| --- | --- |
| web-cd deploy secret | `CLOUDFLARE_API_TOKEN` is the environment-scoped GitHub Secret used by `deploy-staging` and `deploy-production` |
| account id | `CLOUDFLARE_ACCOUNT_ID` is a GitHub Variable, not an Environment Secret |
| runtime smoke | `staging-runtime-smoke` uses separate `STAGING_*` secrets and the existing `secret-provisioning.md` runbook |
| mutation boundary | `gh secret set`, Cloudflare token issuance/revoke, deploy run, commit, push, and PR are user-gated |
| CLI stdin contract | `gh secret set` reads stdin when `--body` is omitted |

## Step 1-B: Updated System Spec Files

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Added staging / production web-cd Environment Secret boundary and corrected stale `--body -` guidance for staging-runtime-smoke stdin injection |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Linked followup-002 to the active CI secret alignment workflow |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added quick lookup for staging / production deploy secret provisioning |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added resource-map coverage for the workflow and runbook artifacts |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | Regenerated after reference changes |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | Regenerated after reference changes |
| `.claude/skills/aiworkflow-requirements/changelog/20260514-ci-secret-alignment-followup-002-staging-production-secret-runbook.md` | Added same-wave changelog |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | Added history row |

## Step 1-C: Workflow And Source Task Sync

| File | Update |
| --- | --- |
| `docs/30-workflows/ci-secret-alignment-followup-002-staging-production-secret-runbook/` | Full Phase 1-13 workflow root and Phase 11/12 outputs |
| `docs/30-workflows/unassigned-task/ci-secret-alignment-followup-002-staging-production-secret-runbook.md` | Reclassified from `未実施` to `consumed_by_workflow` with canonical pointer |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/index.md` | Parent index now links staging / production / staging-runtime-smoke runbook family |

## Step 2: Code / Script Reclassification

The original task was marked docs-only because `web-cd.yml` already references the correct secret and variable names. Close-out review found an adjacent executable helper still using stale `gh secret set --body -` guidance. Under CONST_009, that makes the actual close-out `implementation / NON_VISUAL / docs_plus_script_fix`.

| File | Rationale |
| --- | --- |
| `scripts/smoke/provision-staging-secrets.sh` | Corrected stdin contract to pipe `op read` into `gh secret set` without stale `--body -` |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | Synchronized operator text with the helper contract |

No `apps/`, `packages/`, or `.github/workflows/` changes were required.

## Artifacts Parity

Root `artifacts.json` and `outputs/artifacts.json` both carry `taskType=implementation`, `visualEvidence=NON_VISUAL`, `workflow_state=completed`, and `implementationCategory=docs_plus_script_fix`. Phase 11 ledgers include `main.md`, `manual-smoke-log.md`, `link-checklist.md`, and evidence files.

## Phase 11 Evidence Boundary

Phase 11 is static/read-only plus local syntax validation. No screenshot is required because the task has no UI. Runtime secret placement and deploy smoke are user-gated operations and are not represented as PASS evidence.
