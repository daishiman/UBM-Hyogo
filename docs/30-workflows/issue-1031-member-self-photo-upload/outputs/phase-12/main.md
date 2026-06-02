# Phase 12 Main: issue-1031-member-self-photo-upload

## Status

`implemented_local_runtime_pending / implementation / VISUAL`

This close-out wave validates and documents the local implementation. Staging runtime evidence, remote D1 apply, commit, push, PR, and Issue mutation remain user-gated.

## Scope Implemented Locally

- D1 migration `0023_member_photos_source.sql` with additive `source TEXT NOT NULL DEFAULT 'admin'`.
- `POST /me/photo` and `DELETE /me/photo` own-profile endpoints.
- `GET /me/profile` optional `photoUrl` fail-soft extension.
- Profile `PhotoUpload.client.tsx` UI, web proxy, and client helper.
- Focused API, repository, shared schema, web component, proxy, and visual evidence plan.

## Same-Wave Corrections

- Root wording now uses `implemented_local_runtime_pending` to match apps/api + apps/web diffs and Phase 11 component screenshot evidence.
- Stale `@repo/*` test commands were replaced with measured package names: `@ubm-hyogo/api`, `@ubm-hyogo/web`, `@ubm-hyogo/shared`.
- Phase 12 strict 7 files and output `artifacts.json` were physically updated.
- aiworkflow-requirements quick-reference, resource-map, task-workflow-active, artifact inventory, changelog, and API/database specs were synchronized.
