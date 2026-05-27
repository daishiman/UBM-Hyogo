# Phase 11 Manual Smoke Log

## Local Runtime

- Web: `http://127.0.0.1:3010`
- Mock API: `http://127.0.0.1:8787`
- Auth: signed local `authjs.session-token` cookie with `isAdmin=true`

## Checked Routes

| Route | Result |
| --- | --- |
| `/admin/members` | rendered member list with prototype-aligned table |
| `/admin/members?q=zzzzz` | rendered empty state |
| `/admin/members?filter=published` | rendered filtered state |
| `/admin/members?filter=hidden` | rendered hidden filter state |

## Screenshot Inventory

See `outputs/phase-11/screenshot-inventory.json`.
