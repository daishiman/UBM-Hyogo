# SMOKE-COVERAGE-MATRIX

> Source task: `docs/30-workflows/task-25-ui-mvp-w8-par-routes-smoke-coverage/`
> Parent workflow: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/`
> Classification: `docs-only / NON_VISUAL / verify_existing`

## Summary

This matrix documents what the current Playwright smoke and visual gates protect for the UI MVP recovery workflow.

The current executable smoke test contains **17 URL entries**. The parent SCOPE describes **19 UI surfaces** because `error.tsx` and `loading.tsx` are component surfaces, not stable URL routes in `full-smoke.spec.ts`. This file therefore uses the precise contract:

- 17 URL smoke entries covered by `playwright-smoke / smoke (chromium)`.
- 4 visual baselines covered by `playwright-smoke / visual (chromium, 4 screens)`.
- 2 component-only surfaces (`error.tsx`, `loading.tsx`) documented as `N/A-runtime-observation` until deterministic fixtures exist.

## CI Gate References

| Gate | Current source |
| --- | --- |
| `verify-design-tokens / verify-design-tokens` | `.github/workflows/verify-design-tokens.yml` |
| `playwright-smoke / smoke (chromium)` | `.github/workflows/playwright-smoke.yml` and `apps/web/playwright/tests/full-smoke.spec.ts` |
| `playwright-smoke / visual (chromium, 4 screens)` | `.github/workflows/playwright-smoke.yml` and `apps/web/playwright/tests/visual/*.spec.ts` |

## Legend

| Token | Meaning |
| --- | --- |
| `A11Y-DEFAULT` | Axe tags `wcag2a,wcag2aa`; `color-contrast` disabled; `serious` / `critical` violations must be 0 |
| `TOKEN-SSOT` | Token drift is delegated to `verify-design-tokens / verify-design-tokens` |
| `Visual: -` | No committed visual baseline for this route |
| `N/A-runtime-observation` | The surface exists, but the current smoke suite has no deterministic route-level trigger |

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
| 18 | `app/error.tsx` | public surface | `N/A-runtime-observation` | error boundary surface | `TOKEN-SSOT` | `N/A-runtime-observation` | deterministic throw fixture is not present in current smoke suite | `-` | `apps/web/app/error.tsx` |
| 19 | `app/loading.tsx` | public surface | `N/A-runtime-observation` | `data-page="loading"` | `TOKEN-SSOT` | `N/A-runtime-observation` | deterministic network-throttle observation is not present in current smoke suite | `-` | `apps/web/app/loading.tsx`, `apps/web/app/(admin)/admin/audit/loading.tsx` |

## Axis Totals

| Axis | Covered | Notes |
| --- | ---: | --- |
| URL status | 17/17 | The two remaining SCOPE surfaces are not URL routes in `full-smoke.spec.ts` |
| DOM | 19/19 | 17 runtime selectors plus 2 component-level surfaces |
| Token | 19/19 | Delegated to the token drift gate |
| A11y runtime | 17/19 | `error.tsx` and `loading.tsx` need deterministic observation before runtime a11y can be asserted |
| Interaction smoke | 17/19 | Component-only surfaces are documented, not executed |
| Visual baseline | 4/19 | `login`, `public-top`, `admin-dashboard`, `profile` |

## Drift Notes

| Drift | Resolution |
| --- | --- |
| Historical task-18 text says 19 executable routes including `/about`, `/rules`, `/contact`, and login query states | Current `apps/web/app` and `full-smoke.spec.ts` show `/register`, `/privacy`, `/terms`, one `/login`, and two component-only surfaces. This matrix follows the current worktree. |
| `.github/workflows/playwright-smoke.yml` still has step label `Run 19-route smoke` | The workflow job context remains valid, but the step label is stale. Task-25 is docs-only and records the current executable contract as 17 URL entries + 2 component-only surfaces without editing the workflow file. |
| Parent workflow was archived under `completed-tasks/`, while task-25 referenced the old live root | This file is placed in the archived parent workflow root and task-25 references are updated accordingly. |

## Future Candidates

These are explicit non-goals for task-25 because deterministic route triggers do not currently exist.

| Candidate | Reason | Suggested owner |
| --- | --- | --- |
| Full visual regression baseline for remaining non-baseline surfaces | Current visual gate intentionally protects 4 high-value screens | post-MVP visual regression task |
| Error boundary route fixture | Runtime `error.tsx` needs a deterministic throw route before smoke can assert it | task-05 / regression follow-up |
| Loading state observation fixture | `loading.tsx` needs stable latency control without flaky network sleeps | regression follow-up |

## Verification Commands

```bash
grep -E '^\| [0-9]+ \|' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md | wc -l
rg -n "path: '" apps/web/playwright/tests/full-smoke.spec.ts
ls apps/web/playwright/tests/visual/*.spec.ts
rg -n "playwright-smoke|verify-design-tokens" .github/workflows package.json apps/web/package.json
```
