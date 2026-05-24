# Implementation Guide

## Implemented Files

| File | Change |
| --- | --- |
| `apps/web/src/components/layout/AdminTopbar.tsx` | New Server Component with optional `breadcrumb` and `actions` slots. |
| `apps/web/app/(admin)/layout.tsx` | Imports and renders `<AdminTopbar />`; wrapper route/theme attributes remain in layout. |
| `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` | Covers default render, slot injection, null/falsy boundaries, OKLch tokens, axe critical 0. |

## Key Contract

- `data-shell="topbar"` belongs to the primitive root `<header>`.
- `data-route-group="admin"` and `data-theme="cool"` remain on the layout wrapper.
- `actions === undefined` is the only hidden placeholder case.
- `breadcrumb ?? "管理"` is intentional.

## Verification

- `@ubm-hyogo/web` Vitest suite passed.
- Existing `(admin)/layout.spec.tsx` passed without modification.
- Phase 11 visual evidence is saved under `outputs/phase-11/screenshots/`:
  - `admin-topbar-default.png`
  - `admin-shell-regression.png`
  - `admin-topbar-axe.png`
  - `admin-topbar-dom-contract.txt`
