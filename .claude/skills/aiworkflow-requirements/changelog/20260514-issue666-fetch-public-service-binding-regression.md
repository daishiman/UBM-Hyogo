# 2026-05-14 Issue #666 fetch/public service binding regression

## Summary

Issue #666 was synchronized as `implemented_local_evidence_captured / implementation_complete_pending_pr / implementation / NON_VISUAL`.

## Updated

- `docs/30-workflows/completed-tasks/issue-666-fetch-public-service-binding-regression/`
- `apps/web/src/lib/fetch/public.ts`
- `apps/web/src/lib/fetch/public.spec.ts`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/testing-playwright-e2e.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-666-fetch-public-service-binding-regression-artifact-inventory.md`
- `docs/30-workflows/completed-tasks/task-e2e-stage3b-fetch-public-service-binding-priority-regression-001.md`

## Boundary

Production / staging service binding priority is preserved even when `PUBLIC_API_BASE_URL` is present. HTTP fallback priority is limited to Vitest (`NODE_ENV=test`) and Playwright (`PLAYWRIGHT_TEST=1`) contexts; `CI=true` alone is intentionally ignored because GitHub Actions build/deploy also sets it. Commit, push, PR, and GitHub Actions runtime evidence remain user-gated.
