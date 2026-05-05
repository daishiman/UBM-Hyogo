# NON_VISUAL UI Smoke: My Page Attendance

Status: `CAPTURED_NON_VISUAL`

`/profile` rendering is downstream of `GET /me/profile`. This workflow does not change `apps/web`; the verified contract is that the API now returns `MemberProfile.attendance` from the D1 read provider instead of the previous builder fallback.

Evidence:

- `apps/api/src/routes/me/index.ts` injects `createAttendanceProvider(ctx)` into `buildMemberProfile`.
- `apps/api/src/repository/_shared/builder.ts` maps provider results into `MemberProfile.attendance`.
- `apps/api/src/repository/__tests__/builder.test.ts` covers provider injection for member profile.

Screenshot: not required. `artifacts.json.metadata.visualEvidence` is `NON_VISUAL`.
