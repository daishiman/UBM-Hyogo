# System Spec Update Summary

## Step 1-A: Workflow And Logs

| Target | Result |
| --- | --- |
| Workflow root | `workflow_state=spec_created`; Phase 1-3 completed, Phase 4-13 pending. |
| Parent task | `docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md` remains the parent source. |
| UT-27 handoff | `outputs/phase-10/handoff-to-ut27.md` added as the explicit variable handoff artifact. |
| Requirements log | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` updated for UT-28 close-out sync. |

## Step 1-B: Implementation Status

UT-28 is an implementation task, but this PR is still `spec_created`. Real Cloudflare mutation is not complete. The following remain pending until Phase 13 user approval:

- `bash scripts/cf.sh pages project create ubm-hyogo-web --production-branch=main`
- `bash scripts/cf.sh pages project create ubm-hyogo-web-staging --production-branch=dev`
- `pages project list` evidence
- dev/main deploy smoke

## Step 1-C: Related Tasks

| Task | Relationship |
| --- | --- |
| 01b | Cloudflare account, API token, and wrapper prerequisite. |
| UT-05 | Owns `web-cd.yml` and OpenNext output-form fixes. |
| UT-27 | Receives `CLOUDFLARE_PAGES_PROJECT=ubm-hyogo-web`. |
| UT-06 | Consumes successful production deploy as downstream evidence. |
| UT-16 | Custom domain binding depends on existing Pages projects. |
| UT-29 | Post-CD smoke uses the project URLs fixed here. |
| UT-25 | Cloudflare service account / secret placement remains separate. |

## Step 2: Canonical Specs Updated

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Added UT-28 Pages project creation canonical contract: names, branches, compatibility, Git integration OFF, OpenNext blocker. |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | Fixed `CLOUDFLARE_PAGES_PROJECT` semantics and staging suffix derivation. |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Clarified that the variable stores the production base project only. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-backlog.md` | Linked UT-28 findings to existing OpenNext/workflow/skill feedback backlog items. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added UT-28 quick lookup. |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | Added UT-28 changelog entry. |

## Scope N/A Table

| Requested area | Result |
| --- | --- |
| `apps/desktop/` | N/A. This repo branch is Web/API oriented and has no UT-28 desktop surface. |
| `apps/backend/` | N/A by path name. The backend app is `apps/api/`; UT-28 does not modify API code. |
| `apps/web/` | No code edit in UT-28. Existing `.next` output remains a preflight blocker unless UT-05 records an exception. |
| `packages/shared/` | No shared runtime code change required. |
