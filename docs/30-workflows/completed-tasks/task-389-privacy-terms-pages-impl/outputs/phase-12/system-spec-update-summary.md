# system-spec-update-summary

## Summary

Same-wave sync targets:

- `.claude/skills/aiworkflow-requirements/references/auth-google-oauth-cf-integration.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/{quick-reference.md,resource-map.md}`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-05a-authjs-admin-gate-2026-04.md`

The current SSOT already contains Google OAuth verification checks for `apps/web/app/privacy/page.tsx` and `apps/web/app/terms/page.tsx`. This cycle updates indexes and task workflow state so task-389 is discoverable as local-code-complete / web-build-blocked / runtime evidence pending.

## Step 1-A: Task Completion Record

- Workflow: `docs/30-workflows/task-389-privacy-terms-pages-impl/`
- Status: `implemented-local / runtime deploy pending user approval`
- Issue: #389 is CLOSED; PR text must use `Refs #389`, not `Closes #389`.

## Step 1-B: Implementation Status

| Area | Status |
| --- | --- |
| `apps/web/app/privacy/page.tsx` | local implemented |
| `apps/web/app/terms/page.tsx` | local implemented |
| focused tests | added |
| web build | blocked by #385 regression |
| staging / production deploy | blocked until web build passes and user approves deploy |
| OAuth consent screenshot | pending production URL + Cloud Console access |

## Step 1-C: Related Tasks

- Source unassigned task remains historical input: `docs/30-workflows/unassigned-task/task-05a-privacy-terms-pages-001.md`.
- #385 is CLOSED in GitHub but the build regression recurred during this cycle. Treat deploy as blocked until the existing build-prerender task is genuinely resolved.

## Step 2: System Spec Update Need

判定: no new API / D1 / shared schema contract. Existing auth OAuth SSOT already lists privacy / terms page requirements, but task workflow/index state required same-wave sync and has been updated.
