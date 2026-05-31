# Phase 11 Runtime Notes

- Captured at: 2026-05-30T07:13:48.608Z
- Source: Playwright local dev server via `members-ux-clarity.spec.ts`.
- Matrix: 4 viewports x 3 density values x 2 states.
- Dynamic region masked: `[data-role="pagination-meta"]`.
- Cold-start route warm-up: config ready URL `/members` + spec `beforeAll`; direct-script supplementation is not required.
- Mobile filter expansion: click waits for `data-expanded=true`; visual capture fallback fixes the expanded state if hydration is still settling.
- Evidence path: docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/phase-11/.
