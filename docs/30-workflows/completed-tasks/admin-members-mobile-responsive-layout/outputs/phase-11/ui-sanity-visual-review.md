# UI Sanity Visual Review

## Local Review

| Check | Status | Evidence |
| --- | --- | --- |
| Single table DOM retained | pass | `MembersTable.tsx` keeps one `<table data-testid="admin-members-table">` |
| Mobile card selector scoped | pass | CSS is under `[data-component="admin-members-table"]` |
| Select + member share first mobile row | pass | `data-cell="select"` and `data-cell="member"` share the row grid |
| Publish + action share final mobile row | pass | `data-cell="publish"` and `data-cell="actions"` share the row grid |
| Desktop table unaffected by media query | pass | rules are inside `@media (max-width: 640px)` |
| CSS dimensions use tokens | pass | added mobile CSS uses `var(--ubm-space-*)` and `var(--ubm-text-xs)` |
| Browser overflow check | pass | `outputs/phase-11/screenshots/screenshot-metrics.json` has overflowPass=true for 375 / 640 / 1280 |

## Screenshot Evidence

CSS-contract Chromium screenshots were captured with the canonical names in `canonical-paths.json`:

- `outputs/phase-11/screenshots/admin-members-table-mobile-card-375.png`
- `outputs/phase-11/screenshots/admin-members-table-mobile-card-640.png`
- `outputs/phase-11/screenshots/admin-members-table-desktop-table-1280.png`

Authenticated `/admin/members` route screenshots remain user-gated. Dummy PNGs are forbidden and were not used.
