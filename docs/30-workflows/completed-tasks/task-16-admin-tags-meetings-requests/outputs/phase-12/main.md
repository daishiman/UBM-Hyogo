# Phase 12 Main

task-16 was corrected from a stale new-tree implementation spec to an existing implementation contract alignment package.

Key corrections:

- `apps/web/src/app` -> `apps/web/app`
- `src/features/admin` -> `src/components/admin`
- `lib/api/admin-*` / `adminClient` namespace -> `src/lib/admin/api.ts` and `src/lib/admin/server-fetch.ts`
- old request decision endpoint -> `/admin/requests/:noteId/resolve`
- `approved` status -> `resolved`
