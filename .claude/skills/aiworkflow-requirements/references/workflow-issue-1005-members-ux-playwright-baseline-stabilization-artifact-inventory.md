# workflow-issue-1005-members-ux-playwright-baseline-stabilization artifact inventory

| Type | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1005-members-ux-playwright-baseline-stabilization/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1005-members-ux-playwright-baseline-stabilization/artifacts.json`, `docs/30-workflows/completed-tasks/issue-1005-members-ux-playwright-baseline-stabilization/outputs/artifacts.json` |
| phase 11 result | `docs/30-workflows/completed-tasks/issue-1005-members-ux-playwright-baseline-stabilization/outputs/phase-11/manual-test-result.md` |
| visual evidence | `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/screenshots/members-ux-clarity-*.png` |
| runtime notes | `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/runtime-notes.md` |
| phase 12 strict 7 | `docs/30-workflows/completed-tasks/issue-1005-members-ux-playwright-baseline-stabilization/outputs/phase-12/` |
| implementation targets | `apps/web/playwright.config.ts`, `apps/web/playwright/tests/members-ux-clarity.spec.ts` |

Status: `implemented_local_evidence_captured / implementation / VISUAL`.

## Local Evidence

- `pnpm --filter @ubm-hyogo/web exec tsc --noEmit --pretty false`: PASS.
- `pnpm --filter @ubm-hyogo/web lint`: PASS.
- `curl -I --max-time 180 http://localhost:3000/members`: PASS (`HTTP/1.1 200 OK`; first compile observed at 74s).
- `PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_EVIDENCE_TASK=members-ux-clarity-baseline ../../node_modules/.bin/playwright test members-ux-clarity --project=desktop-chromium`: PASS (`12 passed`).
- `CI=1 PLAYWRIGHT_BASE_URL=http://localhost:3105 PLAYWRIGHT_EVIDENCE_TASK=members-ux-clarity-baseline pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity --project=desktop-chromium`: PASS (`12 passed (4.0m)`).
- PNG count: `24`.
- Stale active path guard: `docs/30-workflows/members-list-ux-clarity/` not created.

## Lessons Learned

- **L-I1005-001** completed-task path drift is bidirectional. Moving a workflow root into `completed-tasks/` requires checking not only moved docs, but also non-doc consumers (`apps/web/playwright/**`, config `EVIDENCE_DIR`, spec-local `workflowRoot`) that hardcode `docs/30-workflows/<slug>`.
- **L-I1005-002** visual baseline specs that call `page.screenshot({ path })` need a spec-local canonical default plus task-specific env override. Global `PLAYWRIGHT_EVIDENCE_DIR` alone does not rewrite explicit screenshot paths.
- **L-I1005-003** Next dev cold compile can exceed 120s for `/members`; Playwright webServer ready URL should target the actual route, config `webServer.timeout` must be extended for the evidence flag, and spec hooks that warm the route must set an explicit hook timeout.
- **L-I1005-004** evidence-only visual specs should be default-excluded from the broad Playwright matrix and enabled by task flag / argv match, with non-primary projects ignoring the spec to avoid duplicate PNG overwrite and runtime cost.
- **L-I1005-005** mobile collapsed filters can remain hidden during cold-start hydration even after a visible click; visual baseline specs should wait on the state attribute (`data-expanded=true`) and may use a capture-only DOM-state fallback when component tests already cover the interaction contract.
