# Implementation Guide — admin-requests-prototype-alignment-and-404-fix

## Part 1 — Plain-Language Explanation

The admin requests page is the office counter where staff handle member requests
such as "make my profile public again" or "delete my account." The current task
spec describes two repairs: make the counter reachable again when staging returns
`ADMIN_FETCH_404`, and make the page look like the rest of the admin area.

The local repair is now coded. It keeps the existing route and existing page,
reuses existing components and tokens, and proves the page with focused local
tests plus a local authenticated screenshot. Staging deploy and staged visual
baseline remain approval-gated.

## Part 2 — Technical Summary

Task A owns the API 404 investigation and fix around
`apps/api/src/routes/admin/requests.ts`, its mount in `apps/api/src/index.ts`,
and the web server fetch error boundary. Task B owns the visual alignment of
`apps/web/app/(admin)/admin/requests/page.tsx`,
`RequestQueuePanel.tsx`, `RequestQueueDetail.tsx`, and the admin staging visual
Playwright coverage.

The implementation must not add a new endpoint, D1 migration, design token, or
primitive. Existing contracts stay canonical: `GET /admin/requests` and
`POST /admin/requests/:noteId/resolve`.

## Implemented Steps

| Step | Owner | Action |
| --- | --- | --- |
| 1 | Task A | Added worker mount regression coverage so `/admin/requests` dispatch cannot silently become 404. |
| 2 | Task A | Extended D1 contract coverage for non-admin 403 and `delete_request` listing. |
| 3 | Task B | Moved `/admin/requests` markup onto prototype primitives (`page-enter`, `page-head`, `card`, `btn-row`, `card-flat`). |
| 4 | Task B | Kept state/event ownership in client components; route page owns the primary `h1`, panel owns hidden filter `h2`. |
| 5 | Task B | Added local authenticated Playwright screenshot coverage with semantic primitive assertions. |
| 6 | Task B | Added staging visual spec as the user-gated baseline path. |

## Validation Commands

```bash
pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/admin/requests.contract.spec.ts
pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/requests.mount.spec.ts
pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx
AUTH_SECRET=playwright-auth-secret-playwright-auth-secret PLAYWRIGHT_BASE_URL=http://localhost:3107 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-requests-prototype-alignment-and-404-fix/outputs/phase-11 ADMIN_REQUESTS_EVIDENCE=1 pnpm --filter @ubm-hyogo/web exec playwright test tests/admin-requests.spec.ts --grep "視覚証跡" --project=desktop-chromium
```

The staging deploy, staging curl 200 proof, and staging visual baseline require
user-approved runtime credentials/session setup. Until then, they stay
`pending_user_gate` and must not be recorded as staging PASS.

## Known Limits

- Staging deploy, staging authenticated screenshots, commit, push, and PR are explicitly
  outside the current autonomous edit boundary.
- If Phase 5 discovers the 404 is caused by external deployed-state drift rather
  than repository code, the implementation must reclassify with fresh evidence
  instead of inventing a local code patch.
