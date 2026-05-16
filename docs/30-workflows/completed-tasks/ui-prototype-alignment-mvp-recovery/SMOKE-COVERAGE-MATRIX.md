# SMOKE-COVERAGE-MATRIX

> Source task: `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/`
> Parent workflow: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/`
> Classification: `docs-only / NON_VISUAL / verify_existing`

## Summary

This matrix documents what the current Playwright smoke and visual gates protect for the UI MVP recovery workflow.

The current smoke coverage contains **19 UI surface entries**: 17 regular route checks in `full-smoke.spec.ts` plus 2 deterministic `/smoke` fixture observations in `staging-smoke.spec.ts`. The parent SCOPE describes **19 UI surfaces**; `error.tsx` and `loading.tsx` are covered by dedicated fixture routes rather than by the regular route table.

- 17 regular URL smoke entries covered by `playwright-smoke / smoke (chromium)`.
- 4 visual baselines covered by `playwright-smoke / visual (chromium, 4 screens)`.
- 2 component-only surfaces (`error.tsx`, `loading.tsx`) observed through deterministic `staging-smoke.spec.ts` fixture checks.

## CI Gate References

| Gate | Current source |
| --- | --- |
| `verify-design-tokens / verify-design-tokens` | `.github/workflows/verify-design-tokens.yml` |
| `playwright-smoke / smoke (chromium)` | `.github/workflows/playwright-smoke.yml` and `apps/web/playwright/tests/full-smoke.spec.ts` |
| `playwright-smoke / visual (chromium, 4 screens)` | `.github/workflows/playwright-smoke.yml` and `apps/web/playwright/tests/visual/*.spec.ts` |
| `staging-smoke fixture observation` | `apps/web/tests/e2e/staging-smoke.spec.ts` (`/smoke/error-boundary`, `/smoke/loading-state`) |

## Legend

| Token | Meaning |
| --- | --- |
| `A11Y-DEFAULT` | Axe tags `wcag2a,wcag2aa`; `color-contrast` disabled; `serious` / `critical` violations must be 0 |
| `FIXTURE-SEMANTIC-A11Y` | Fixture-level semantic assertion such as `role="alert"` or `role="status"` + `aria-live`; not an Axe scan |
| `TOKEN-SSOT` | Token drift is delegated to `verify-design-tokens / verify-design-tokens` |
| `Visual: -` | No committed visual baseline for this route |
| `fixture-runtime-observation` | Component-only surface is observed through a deterministic `/smoke` fixture route |

## Coverage Matrix

| # | Surface | Auth | Status | DOM assertion | Token axis | A11y | Interaction smoke | Visual baseline | Existing spec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `/` | public | `<400` | `main h1` or `[data-testid="public-hero"]` | `TOKEN-SSOT` | `A11Y-DEFAULT` | public top renders and links to member/search flows | `public-top` | `full-smoke.spec.ts`, `visual/public-top.spec.ts`, `public-flow.spec.ts` |
| 2 | `/members` | public | `<400` | `main h1` or `[data-testid="member-grid"]` | `TOKEN-SSOT` | `A11Y-DEFAULT` | member grid renders searchable listing | `-` | `full-smoke.spec.ts`, `public-flow.spec.ts`, `public-top-and-list.spec.ts` |
| 3 | `/members/sample-001` | public | `<400` | `main h1` | `TOKEN-SSOT` | `A11Y-DEFAULT` | member detail fixture renders without email leak | `-` | `full-smoke.spec.ts`, `public-detail-register-legal.spec.ts` |
| 4 | `/register` | public | `<400` | `main h1` | `TOKEN-SSOT` | `A11Y-DEFAULT` | external registration link is visible | `-` | `full-smoke.spec.ts`, `public-flow.spec.ts`, `public-detail-register-legal.spec.ts` |
| 5 | `/privacy` | public | `<400` | `main h1` | `TOKEN-SSOT` | `A11Y-DEFAULT` | legal prose renders | `-` | `full-smoke.spec.ts`, `public-detail-register-legal.spec.ts` |
| 6 | `/terms` | public | `<400` | `main h1` | `TOKEN-SSOT` | `A11Y-DEFAULT` | legal prose renders | `-` | `full-smoke.spec.ts`, `public-detail-register-legal.spec.ts` |
| 7 | `/login` | public | `<400` | `main h1` | `TOKEN-SSOT` | `A11Y-DEFAULT` | login card state machine has focused smoke in `login-smoke.spec.ts` | `login` | `full-smoke.spec.ts`, `visual/login.spec.ts`, `login-smoke.spec.ts` |
| 8 | `/profile` | member | `<400` after member fixture | `main h1` | `TOKEN-SSOT` | `A11Y-DEFAULT` | profile request/delete flows have focused smoke specs | `profile` | `full-smoke.spec.ts`, `visual/profile.spec.ts`, `profile*.spec.ts` |
| 9 | `/admin` | admin | `<400` after admin fixture | `main h1` or `[aria-labelledby="admin-dashboard-h"]` | `TOKEN-SSOT` | `A11Y-DEFAULT` | dashboard cards render | `admin-dashboard` | `full-smoke.spec.ts`, `visual/admin-dashboard.spec.ts`, `admin-pages.spec.ts` |
| 10 | `/admin/members` | admin | `<400` after admin fixture | `main h1` or `[aria-labelledby="admin-members-h"]` | `TOKEN-SSOT` | `A11Y-DEFAULT` | members table/drawer flows have focused specs | `-` | `full-smoke.spec.ts`, `admin-pages.spec.ts`, `admin-member-delete.spec.ts` |
| 11 | `/admin/tags` | admin | `<400` after admin fixture | `main h1` or `text=タグキュー` | `TOKEN-SSOT` | `A11Y-DEFAULT` | tag queue shell renders | `-` | `full-smoke.spec.ts`, `admin-pages.spec.ts` |
| 12 | `/admin/meetings` | admin | `<400` after admin fixture | `main h1` or `text=開催日` | `TOKEN-SSOT` | `A11Y-DEFAULT` | meeting list/form shell renders | `-` | `full-smoke.spec.ts`, `admin-pages.spec.ts` |
| 13 | `/admin/schema` | admin | `<400` after admin fixture | `main h1` or `[data-testid="admin-schema-section"]` | `TOKEN-SSOT` | `A11Y-DEFAULT` | schema sections render | `-` | `full-smoke.spec.ts`, `admin-pages.spec.ts`, `admin-schema-conflicts-audit.spec.ts` |
| 14 | `/admin/requests` | admin | `<400` after admin fixture | `main h1` or `text=依頼キュー` | `TOKEN-SSOT` | `A11Y-DEFAULT` | request queue actions have focused smoke | `-` | `full-smoke.spec.ts`, `admin-requests.spec.ts` |
| 15 | `/admin/identity-conflicts` | admin | `<400` after admin fixture | `main h1` | `TOKEN-SSOT` | `A11Y-DEFAULT` | identity conflict resolution has focused smoke | `-` | `full-smoke.spec.ts`, `admin-identity-conflicts.spec.ts`, `admin-schema-conflicts-audit.spec.ts` |
| 16 | `/admin/audit` | admin | `<400` after admin fixture | `main h1` or `[data-component="admin-audit"]` | `TOKEN-SSOT` | `A11Y-DEFAULT` | audit timeline/filter shell renders | `-` | `full-smoke.spec.ts`, `admin-schema-conflicts-audit.spec.ts` |
| 17 | `/__not_found_canary` | public | `404` | `[data-testid="not-found"]` | `TOKEN-SSOT` | `A11Y-DEFAULT` | not-found page renders | `-` | `full-smoke.spec.ts`, `public-detail-register-legal.spec.ts` |
| 18 | `app/error.tsx` | public surface | `fixture-runtime-observation` | `role="alert"` + `エラーID` via `/smoke/error-boundary` | `TOKEN-SSOT` | `FIXTURE-SEMANTIC-A11Y` | deterministic throw fixture renders the app error boundary | `-` | `apps/web/app/error.tsx`, `apps/web/app/smoke/error-boundary/page.tsx`, `staging-smoke.spec.ts` |
| 19 | `app/loading.tsx` | public surface | `fixture-runtime-observation` | `[data-page="smoke-loading-state"]` -> `[data-page="smoke-loading-state-fixture"]` via `/smoke/loading-state` | `TOKEN-SSOT` | `FIXTURE-SEMANTIC-A11Y` | deterministic server delay triggers loading boundary without network throttle | `-` | `apps/web/app/loading.tsx`, `apps/web/app/smoke/loading-state/loading.tsx`, `apps/web/app/smoke/loading-state/page.tsx`, `staging-smoke.spec.ts` |

## Axis Totals

| Axis | Covered | Notes |
| --- | ---: | --- |
| URL status | 19/19 | 17 regular route entries plus 2 deterministic fixture observations |
| DOM | 19/19 | 17 runtime selectors plus 2 component-level surfaces |
| Token | 19/19 | Delegated to the token drift gate |
| A11y runtime | 19/19 | 17 Axe-backed route checks plus semantic fixture assertions for `error.tsx` and `loading.tsx` |
| Interaction smoke | 19/19 | Component-only surfaces use fixture interactions rather than user workflows |
| Visual baseline | 4/19 | `login`, `public-top`, `admin-dashboard`, `profile` |

## Drift Notes

| Drift | Resolution |
| --- | --- |
| Historical task-18 text says 19 executable routes including `/about`, `/rules`, `/contact`, and login query states | Current `apps/web/app` and `full-smoke.spec.ts` show `/register`, `/privacy`, `/terms`, one `/login`, and two component-only surfaces. This matrix follows the current worktree. |
| `.github/workflows/playwright-smoke.yml` still has step label `Run 19-route smoke` | The workflow job context remains valid, but the step label is stale. Task-25 is docs-only and records the current executable contract as 17 URL entries + 2 component-only surfaces without editing the workflow file. |
| Parent workflow was archived under `completed-tasks/`, while task-25 referenced the old live root | This file is placed in the archived parent workflow root and task-25 references are updated accordingly. |

## Future Candidates

These are explicit non-goals for task-25 and the loading-state follow-up.

| Candidate | Reason | Suggested owner |
| --- | --- | --- |
| Full visual regression baseline for remaining non-baseline surfaces | Current visual gate intentionally protects 4 high-value screens | post-MVP visual regression task |
| Full visual regression baseline for loading/error fixtures | Runtime coverage exists; visual baselines remain intentionally out of task-25 scope | post-MVP visual regression task |

## Verification Commands

```bash
grep -E '^\| [0-9]+ \|' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md | wc -l
rg -n "path: '" apps/web/playwright/tests/full-smoke.spec.ts
rg -n "/smoke/(error-boundary|loading-state)" apps/web/tests/e2e/staging-smoke.spec.ts
ls apps/web/playwright/tests/visual/*.spec.ts
rg -n "playwright-smoke|verify-design-tokens" .github/workflows package.json apps/web/package.json
```
