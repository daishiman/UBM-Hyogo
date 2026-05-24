# Phase 11 Local Evidence Test Report

## Summary

Local implementation evidence captured for `AdminTopbar` extraction.

| Command | Result | Notes |
| --- | --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/layout/__tests__/AdminTopbar.spec.tsx` | PASS via pnpm fallback | `mise` warned that `.mise.toml` was untrusted, then the underlying pnpm test command executed. |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(admin)/layout.spec.tsx"` | PASS via pnpm fallback | Existing layout spec remained unmodified and passed. |
| `pnpm --filter @ubm-hyogo/web test ...` | PASS | Vitest selected the web suite; final summary: 124 files passed, 1 skipped, 891 tests passed, 1 skipped. |

## Focused Assertions Covered

- `AdminTopbar` renders `header[data-shell="topbar"]`.
- Default breadcrumb slot renders `管理`.
- Default actions slot is `aria-hidden="true"`.
- `breadcrumb` and `actions` props replace slot contents while keeping wrapper `data-component` selectors.
- `breadcrumb={null}` falls back to `管理`; `breadcrumb={0}` is preserved.
- `actions={null}` and `actions={false}` are treated as explicit injections and do not receive `aria-hidden`.
- OKLch token classes are preserved.
- axe critical violations are zero for default and injected-slot render.
- Existing `(admin)/layout.spec.tsx` passes without modification.

## Runtime Boundary

Local visual screenshots are captured under `outputs/phase-11/screenshots/`:

- `admin-topbar-default.png`
- `admin-topbar-dom-contract.txt`
- `admin-topbar-axe.png`
- `admin-shell-regression.png`

Authenticated `/admin` browser smoke can still be repeated after an admin session is available, but Phase 11 no longer lacks screenshot artifacts.
