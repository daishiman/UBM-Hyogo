# NON_VISUAL UI Smoke: Admin Detail Attendance

Status: `CAPTURED_NON_VISUAL`

Admin member detail rendering is downstream of `GET /admin/members/:memberId`. This workflow does not change `apps/web`; the verified contract is that the admin detail view receives `profile.attendance` from the D1 read provider.

Evidence:

- `apps/api/src/routes/admin/members.ts` injects `createAttendanceProvider(db)` into `buildAdminMemberDetailView`.
- `apps/api/src/repository/_shared/builder.ts` maps provider results into `AdminMemberDetailView.profile.attendance`.
- `apps/api/src/repository/__tests__/builder.test.ts` covers provider injection for admin detail.

Screenshot: not required. `artifacts.json.metadata.visualEvidence` is `NON_VISUAL`.
