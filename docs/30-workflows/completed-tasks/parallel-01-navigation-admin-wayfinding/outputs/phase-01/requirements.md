# Phase 1 Requirements

## Confirmed Scope

PARALLEL-01-NAV implements two admin navigation wayfinding fixes in `apps/web`:

- Admin sidebar home link: `apps/web/src/components/layout/AdminSidebar.tsx`
- Member drawer tag-management link: `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`

No API endpoint, D1 schema, Google Form schema, design token, or primitive component is added.

## Measured Existing Assets

| Asset | Result |
| --- | --- |
| Admin sidebar | `apps/web/src/components/layout/AdminSidebar.tsx` exists and owns the shared admin nav |
| Member drawer | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` exists and owns the detail drawer |
| Tags target | `apps/web/app/(admin)/admin/tags/page.tsx` already consumes `memberId` as `focusMemberId` |
| Design tokens | Existing CSS variables `--ubm-color-accent` and `--ubm-color-border-default` are sufficient |
| Component tests | Existing `AdminSidebar.component.spec.tsx`; new `MemberDrawer.spec.tsx` under `components/__tests__` |

## Decisions

| Topic | Decision |
| --- | --- |
| Sidebar home affordance | Text logo link `UBM兵庫` with `aria-label="ホームに戻る"` |
| Drawer link placement | Final section separated by `border-t` |
| Drawer link label | `タグ管理へ` without a decorative arrow, matching implementation and tests |
| URL safety | Always use `encodeURIComponent(memberId)` |
| Visual evidence | VISUAL task with mock fallback screenshots until real admin auth/mock backend is available |

## Four Conditions

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | Scope excludes API/D1 changes and implementation only touches `apps/web` UI/test files |
| 漏れなし | PASS | Both navigation gaps have implementation, component tests, Phase 11 fallback evidence, and Phase 12 strict 7 |
| 整合性あり | PASS | Existing token names, test suffix rules, and target route contract are reused |
| 依存関係整合 | PASS | `/admin/tags?memberId=` reuses the existing tags page contract |
