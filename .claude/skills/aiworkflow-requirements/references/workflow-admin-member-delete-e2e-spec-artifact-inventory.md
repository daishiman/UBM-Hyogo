# admin-member-delete E2E spec Artifact Inventory

| category | path | status |
|---|---|---|
| workflow root | `docs/30-workflows/admin-member-delete-e2e-spec/` | implemented-local-runtime-pending |
| implementation | `apps/web/playwright/tests/admin-member-delete.spec.ts` | 175 lines / desktop-chromium focused |
| implementation | `apps/web/src/lib/admin/server-fetch.ts` | `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1` SSR fixture gate |
| implementation | `apps/web/playwright.config.ts` | evidence dir + focused dev server env |
| implementation | `apps/web/src/components/admin/MemberDrawer.tsx` | delete/restore mutation result callback |
| implementation | `apps/web/src/components/admin/MembersClient.tsx` | local row `isDeleted` reflection + router refresh |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2c-admin-member-delete.md` | consumed trace updated |
| consumed task | `docs/30-workflows/unassigned-task/e2e-stage-2-2c-admin-member-delete-001.md` | consumed_by workflow root |
| Phase 11 evidence | `docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-11/evidence/` | typecheck / lint / focused E2E / grep / wc / dirty diff |
| Phase 12 outputs | `docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-12/` | strict 7 files present |

## Boundary

- API routes and D1 schema are unchanged.
- Initial `/admin/members` and `/admin/audit` data are server-side fixture data because browser `page.route()` cannot intercept Server Component `fetchAdmin()`.
- Browser `page.route()` remains responsible for drawer detail and delete mutation.
- `test.skip` is limited to cascade preview, which remains Stage 3-owned.
