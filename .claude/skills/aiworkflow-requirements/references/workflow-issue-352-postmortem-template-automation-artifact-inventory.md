# Workflow Artifact Inventory: Issue #352 Postmortem Template Automation

## Summary

Issue #352 postmortem template automation is `implemented-local / implementation / NON_VISUAL / Phase 13 blocked_pending_user_approval`.

The workflow adds deterministic postmortem markdown generation after rollback or production incident handling. It does not replace incident response runbooks, Slack delivery, GitHub Releases automation, commit, push, or PR creation.

## Canonical Workflow

- Workflow root: `docs/30-workflows/completed-tasks/issue-352-postmortem-template-automation/`
- Source unassigned task (closed): `docs/30-workflows/completed-tasks/task-09c-postmortem-template-automation-001.md`
- Upstream evidence: `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/`

## Implementation Artifacts

- Generator: `scripts/postmortem/generate-postmortem.ts`
- Tests: `scripts/postmortem/__tests__/generate-postmortem.test.ts`
- Template: `docs/30-workflows/runbooks/postmortem/template.md`
- Runbook: `docs/30-workflows/runbooks/postmortem/README.md`
- Command: `pnpm postmortem:generate -- --release vX.Y.Z --commit <sha> --evidence <09c-phase-11-dir> --rollback-evidence <rollback-md> --occurred-at <iso8601>`

## Runtime Contract

- `--evidence` must point to a directory with `main.md`.
- `--rollback-evidence` must point to a file.
- Empty rollback evidence files emit `warning: rollback-evidence is empty: <path>` and keep exit 0.
- Missing evidence paths fail with exit 1.
- Write failures fail with exit 2.

## Evidence

- Phase 9 coverage: `docs/30-workflows/completed-tasks/issue-352-postmortem-template-automation/outputs/phase-09/coverage-summary.md`
- Phase 11 CLI smoke: `docs/30-workflows/completed-tasks/issue-352-postmortem-template-automation/outputs/phase-11/script-execution.md`
- Phase 11 rollback warning: `docs/30-workflows/completed-tasks/issue-352-postmortem-template-automation/outputs/phase-11/rollback-evidence-warning.md`
- Phase 13 blocked placeholder: `docs/30-workflows/completed-tasks/issue-352-postmortem-template-automation/outputs/phase-13/main.md`

## System Spec Sync

- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-352-postmortem-template-automation-2026-05.md`
