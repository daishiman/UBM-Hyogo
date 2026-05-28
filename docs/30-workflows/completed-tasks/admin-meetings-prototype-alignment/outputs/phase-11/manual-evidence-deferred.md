# Manual Evidence Deferred

Status: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

Component and local screenshot evidence are separated from staging runtime evidence. Local evidence is recorded in `main.md` and `screenshots/`; authenticated staging refresh/deploy and PR creation remain user-gated.

## Deferred Runtime States

| State | Repro steps | Expected | Future evidence path |
| --- | --- | --- | --- |
| staging list default | user-approved staging refresh, admin login, open `/admin/meetings` | AdminPageHeader, KPI strip, create form, timeline | `outputs/phase-11/staging/list-default.md` |
| staging detail default | open `/admin/meetings/:id` with real session | AdminPageHeader, attendance card, CSV card | `outputs/phase-11/staging/detail-default.md` |
| staging `ADMIN_FETCH_404` check | repeat the route that previously showed `ADMIN_FETCH_404` | classify as resolved or formal runtime issue | `docs/30-workflows/unassigned-task/admin-meetings-staging-admin-fetch-404-runtime-followup.md` |

## Gate

Runtime staging evidence requires explicit user approval for staging deploy/refresh and authenticated capture. Commit, push, and PR are also user-gated.

## Responsibility Split

- `outputs/phase-11/main.md`: local component/test/visual evidence index.
- `outputs/phase-11/screenshots/*.png`: local browser screenshots captured from the implementation.
- This file: runtime staging evidence still deferred behind approval gates.
