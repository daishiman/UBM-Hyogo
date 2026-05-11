# Workflow Artifact Inventory — task-15 admin dashboard and members

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/task-15-admin-dashboard-and-members/` |
| state | `implemented-local-runtime-pending / implementation / VISUAL / Phase 13 blocked_pending_user_approval` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-15-w5-par-admin-dashboard-and-members.md` |
| primary screens | `/admin`, `/admin/members` |
| implementation | `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(admin)/admin/page.tsx`, `apps/web/app/(admin)/admin/members/page.tsx`, `apps/web/src/features/admin/components/**`, `apps/web/src/lib/admin/admin-dashboard-ui.ts` |
| tests | `apps/web/src/features/admin/components/__tests__/*.test.tsx`, `apps/web/src/lib/admin/dashboard-ui.test.ts`, `apps/web/playwright/tests/task15-admin-screenshots.spec.ts` |
| Phase 11 evidence | `docs/30-workflows/task-15-admin-dashboard-and-members/outputs/phase-11/` |
| Phase 12 evidence | `docs/30-workflows/task-15-admin-dashboard-and-members/outputs/phase-12/` |
| boundaries | no new admin API endpoint, no D1 schema change, no shared schema mutation |
| downstream | task-16, task-17, task-18 |

## Notes

`byZone` / `byStatus` are intentionally web-local optional UI slices. The current backend `GET /admin/dashboard` contract remains unchanged.

## Post-merge CI fixes (PR #677 後 / 2026-05-11)

PR #677 (`6c511528`) マージ後、`dev` ブランチ取り込みで露呈した CI failure を以下 5 commit で修正した。詳細な苦戦点は `lessons-learned-task-15-admin-dashboard-and-members-2026-05.md` §L-TASK15-006..010 を参照。

| Commit | 対象 | 内容 |
| --- | --- | --- |
| `c6465df6` | `apps/web/src/styles/globals.css` | Tailwind v4 auto-source を `source(none)` 化し、必要 path のみ `@source` で明示列挙（docs HTML の class 候補スキャン抑止）|
| `f1e5b3cd` | `apps/web/playwright/page-objects/AdminDashboardPage.ts` / `apps/web/playwright/fixtures/auth.ts` / `apps/web/playwright/tests/task15-admin-screenshots.spec.ts` | `KpiCard` の `data-testid="admin-kpi-card-*"` に page-object を追従。`setAdminDashboardUnresolvedSchema` を `Promise<void>` 化し test 側で `await` |
| `566ae824` | `scripts/e2e-mock-api.mjs` | `/__test__/admin-dashboard` 制御 endpoint 追加 + `adminMembers` の 3-fixture 化で SSR fetch に test seed を伝搬 |
| `f4219c36` | `apps/web/src/features/admin/components/__tests__/MemberTable*` | `exactOptionalPropertyTypes: true` 下で `undefined` 代入を避ける型安全 fixture builder へ修正 |
| `80831cdf` | 0% カバレッジ 9 コンポーネント分 test 23 件追加 | dev merge で `MemberDrawer` / `MembersClient` 等が削除され coverage 76.73% へ低下 → 82.73% へ復帰し gate (80%) 通過 |
