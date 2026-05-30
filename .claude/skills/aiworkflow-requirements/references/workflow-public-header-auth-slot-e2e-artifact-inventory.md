# Workflow Artifact Inventory: public-header-auth-slot-e2e

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/` |
| root artifacts | `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/artifacts.json` |
| Phase 11 evidence ledger | `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 13 placeholder | `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/outputs/phase-13/pr-creation-result.md` |
| parent workflow | `docs/30-workflows/public-header-logged-in-nav-cleanup/` |
| Playwright spec | `apps/web/playwright/tests/auth-slot-coverage.spec.ts` |
| storageState setup | `apps/web/playwright/tests/setup-auth.spec.ts` |
| runtime auth state files | `apps/web/playwright/.auth/{guest,member,admin}.json` (ignored) |
| config / CI | `apps/web/playwright.config.ts`, `.github/workflows/playwright-smoke.yml`, `apps/web/playwright/.auth/.gitignore` |

Status: `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr`.

Boundary: this workflow verifies and implements the parent public-header DOM auth-slot contract across 7 routes x 3 states + 4 regressions. It does not add API endpoints, D1 schema, Google Form schema, or Auth.js provider configuration changes. Local code implementation and Playwright evidence are complete; commit, push, PR, and remote CI runtime remain user-gated.

## Lessons Learned

詳細は [[lessons-learned-public-header-auth-slot-e2e-2026-05]] を参照。

| ID | 主題 |
|----|------|
| L-AUTHSL-001 | parent workflow の dependent task は「横断検証 × TC 数」で独立 workflow へ昇格させる |
| L-AUTHSL-002 | 3 状態 storageState は setup project + `dependencies: ['setup-auth']` で一括生成する |
| L-AUTHSL-003 | `data-auth-state` literal 3 値は `AuthView` 型 + DOM assertion 両方で固定する |
| L-AUTHSL-004 | redirect 期待は `/login(\?\|$)` regex で middleware/server guard 両対応する |
| L-AUTHSL-005 | CI matrix 追加は `needs:` + `if: github.event_name != 'schedule'` で既存 job を非破壊にする |
| L-AUTHSL-006 | ROUTES 配列 DRY 化と TC 名 `${state} viewing ${path}` の grepability を両立する |
