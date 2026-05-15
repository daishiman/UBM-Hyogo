# Workflow Artifact Inventory: Issue #666 fetch/public service binding regression

| Category | Path | Purpose |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-666-fetch-public-service-binding-regression/` | Phase 1-13 task spec |
| root ledger | `docs/30-workflows/completed-tasks/issue-666-fetch-public-service-binding-regression/artifacts.json` | workflow state and phase status |
| implementation | `apps/web/src/lib/fetch/public.ts` | environment-gated service binding priority |
| tests | `apps/web/src/lib/fetch/public.spec.ts` | AC-R-02 / AC-R-03 / edge regression coverage |
| phase 11 evidence | `docs/30-workflows/completed-tasks/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/` | local command evidence |
| phase 12 strict outputs | `docs/30-workflows/completed-tasks/issue-666-fetch-public-service-binding-regression/outputs/phase-12/` | strict 7 compliance |
| source task | `docs/30-workflows/completed-tasks/task-e2e-stage3b-fetch-public-service-binding-priority-regression-001.md` | historical single-file proposal, superseded |
| E2E transport spec | `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md` | Stage 3b mock API transport rule narrowed to Vitest / Playwright context; `CI=true` alone is not a fallback trigger |
| quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | lookup entry |
| resource map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | reverse lookup entry |
| active ledger | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow state |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-666-fetch-public-service-binding-regression-2026-05.md` | L-666-001 (`CI=true` is not a fallback trigger) / L-666-002 (`PUBLIC_API_BASE_URL` AND test context) / L-666-003 (completed-tasks move drift) |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260514-issue666-fetch-public-service-binding-regression.md` | per-revision change log |
| playwright config | `apps/web/playwright.config.ts` | `PLAYWRIGHT_TEST=1` webServer env (mock API fallback trigger) |

## State

`implemented_local_evidence_captured / implementation_complete_pending_pr / implementation / NON_VISUAL`

Local code, focused regression test, typecheck, lint, build, inverse assertion, and grep evidence are present. Commit, push, PR, and GitHub Actions runtime evidence are user-gated.
