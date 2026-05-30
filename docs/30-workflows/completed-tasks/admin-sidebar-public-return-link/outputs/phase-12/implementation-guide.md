# Implementation Guide

## What Changed

The admin sidebar now exposes a clear return link to the public site at the bottom of the sidebar, immediately above the user/footer block.

## Files

| File | Change |
| --- | --- |
| `apps/web/src/components/layout/AdminSidebar.tsx` | Move `/` from grouped nav to a dedicated `data-role="public-return"` anchor |
| `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | Add regression coverage for href, label, aria-label, uniqueness, and footer order |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | Replace skipped legacy test with active supersession pointer |
| `apps/web/playwright/tests/admin-sidebar-public-return-link.spec.ts` | Add local visual fixture coverage and screenshot capture for overview, hover, and focus states |

## Screenshots

| State | Path |
| --- | --- |
| Overview | `outputs/phase-11/screenshots/admin-sidebar-overview.png` |
| Hover | `outputs/phase-11/screenshots/public-return-hover.png` |
| Focus | `outputs/phase-11/screenshots/public-return-focus.png` |

The screenshots were captured with a local Playwright fixture that guards the actual `AdminSidebar.tsx` source contract (`data-role`, `aria-label`, visible label, and removal of the old `ホーム` nav item).

## Invariants

- `AdminSidebarProps` is unchanged.
- `AdminSidebarNavItem` is unchanged.
- No endpoint, D1 schema, Auth.js, or Google Form contract changed.
- Styling uses existing CSS variables only; no HEX colors were added.
