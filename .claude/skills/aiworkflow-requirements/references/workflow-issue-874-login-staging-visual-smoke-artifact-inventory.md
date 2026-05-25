# issue-874-login-staging-visual-smoke artifact inventory

## Workflow

| item | path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/artifacts.json` |
| outputs artifacts | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation targets

| item | path | note |
| --- | --- | --- |
| Playwright login smoke | `apps/web/playwright/tests/login-smoke.spec.ts` | `PLAYWRIGHT_EVIDENCE_DIR` overrides explicit screenshot output path |
| staging smoke helper | `scripts/run-login-staging-smoke.sh` | runs staging project only; deploy is not included |

## Evidence

| item | path | status |
| --- | --- | --- |
| staging screenshots | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots/` | pending user-gated runtime |
| staging smoke log | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-smoke.log` | pending user-gated runtime |
| visual diff note | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/evidence/visual-diff-note.md` | pending user-gated runtime |

## Source / parent

| item | path |
| --- | --- |
| parent workflow | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/` |
| source unassigned task (consumed → moved) | `docs/30-workflows/completed-tasks/login-page-prototype-alignment-followup-003-staging-visual-smoke.md` |
| parent detection ledger | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` |
