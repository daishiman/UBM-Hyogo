# workflow-admin-members-mobile-responsive-layout Artifact Inventory

## Summary

- workflow: `docs/30-workflows/completed-tasks/admin-members-mobile-responsive-layout/`
- state: `implemented_local_evidence_captured / implementation / VISUAL`
- date: 2026-06-10
- purpose: Fix `/admin/members` mobile overflow by presenting the existing single table DOM as scoped CSS cards at `max-width: 640px`.

## Implementation Targets

| File | Change |
| --- | --- |
| `apps/web/src/features/admin/components/_members/MembersTable.tsx` | added `data-component`, `data-testid`, `data-cell`, and `data-mobile-label` attributes |
| `apps/web/src/styles/globals.css` | added scoped `@media (max-width: 640px)` table-to-card rules |
| `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | added TC-MT-21..24 |
| `apps/web/playwright/tests/admin-members-mobile.spec.ts` | added mobile/desktop overflow and publish-control smoke |

## Evidence

| Evidence | Result |
| --- | --- |
| focused Vitest | `MembersTable.spec.tsx` 25 tests PASS |
| Playwright CSS contract | `admin-members-mobile.spec.ts` desktop-chromium 5 tests PASS |
| CSS-contract screenshots | 375 / 640 / 1280 captured, overflowPass=true |
| authenticated route screenshots | pending user gate |
| API / D1 / Google Form | unchanged |

## System Specs

- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- `docs/00-getting-started-manual/specs/09-ui-ux.md`

## Lessons

- CSS-only responsive table-to-card tasks should keep a single DOM when existing testids and row selectors are stable contracts.
- jsdom should assert DOM attributes and event boundaries; Playwright should assert computed layout and overflow.
- Baseline follow-up OOS-1 covers other admin tables separately: `/admin/tags` queue, `/admin/tags/catalog` catalog, `/admin/meetings`, `/admin/requests`, `/admin/audit`.

## User Gate

Runtime screenshots, staging deploy, commit, push, and PR remain user-gated.
