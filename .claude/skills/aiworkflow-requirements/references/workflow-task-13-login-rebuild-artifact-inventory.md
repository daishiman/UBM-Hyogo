# Workflow Artifact Inventory: task-13 login rebuild

## Current Canonical Set

| Category | Path |
| --- | --- |
| workflow root | `docs/30-workflows/task-13-login-rebuild/` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-screens-member/task-13-w5-par-login-rebuild.md` |
| root ledger | `docs/30-workflows/task-13-login-rebuild/artifacts.json` |
| output mirror | `docs/30-workflows/task-13-login-rebuild/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/task-13-login-rebuild/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| implementation guide | `docs/30-workflows/task-13-login-rebuild/outputs/phase-12/implementation-guide.md` |

## Runtime Boundary

State: `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING`.

`apps/web` implementation is claimed by this sync. The implementation targets are `apps/web/app/login/**`, `apps/web/src/lib/url/login-query.ts`, `apps/web/src/lib/auth/magic-link-client.ts`, `apps/web/package.json`, and `apps/web/playwright/tests/login-smoke.spec.ts`. Staging smoke, production-equivalent runtime evidence, commit, push, and PR remain user-gated.

## Contract Highlights

| Contract | Value |
| --- | --- |
| state model | 5 core states + `rules_declined` derived state + `gate=admin_required` overlay |
| locator | `data-testid="login-card"` |
| state attribute | `data-state="<LoginGateState>"` |
| alert states | `deleted`, `error`, `rules_declined` |
| package filter | `@ubm-hyogo/web` |
| API boundary | Auth.js + Magic Link API route surface unchanged |

## Upstream And Downstream

| Relationship | Path |
| --- | --- |
| depends on task-09 | `docs/30-workflows/task-09-w3-tailwind-v4-setup/` |
| depends on task-10 | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/` |
| blocks task-18 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-regression/` |

## Evidence

Phase 12 strict evidence is present under `outputs/phase-12/`. Phase 11 local visual evidence is saved under `outputs/phase-11/`; staging smoke remains pending user approval.

## Lessons Learned

`lessons-learned/lessons-learned-task-13-login-rebuild-2026-05.md` に L-13-001..L-13-005（Phase 12 strict 7 出力義務、`package.json#name` driven gate command、Phase 3 locator contract 前倒し、`IMPLEMENTED_LOCAL_RUNTIME_PENDING` 事前再分類、URL state machine の Phase 1 固定）を記録。
