# UI Sanity Visual Review — issue-801 admin error focus transfer

## Current Boundary

The admin error boundary now uses the root error pattern with admin-specific copy:

- `role="alert"` and `aria-live="assertive"`
- h1 `ref`, `tabIndex={-1}`, and mount-time `focus({ preventScroll: true })`
- digest display only when present
- development-only stack rendering
- OKLch token utility classes (`text-danger`, `text-text-3`, `bg-accent`, `border-border`, `bg-surface-2`)

## Runtime Visual Status

`pending_user_gate`. A browser screenshot is planned at `outputs/phase-11/screenshots/admin-error-focus.png` after runtime setup is approved.
