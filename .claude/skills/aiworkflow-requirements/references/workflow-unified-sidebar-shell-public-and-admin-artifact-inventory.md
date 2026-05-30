# workflow-unified-sidebar-shell-public-and-admin artifact inventory

作成日: 2026-05-28

## Summary

`unified-sidebar-shell-public-and-admin` is a `spec_created / implementation / VISUAL` workflow. It defines a unified collapsible sidebar shell for public, member, and admin route groups. Implementation and runtime visual evidence are pending Gate-B/C.

## Canonical workflow

| Artifact | Path | Status |
| --- | --- | --- |
| root | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/` | present |
| index | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/index.md` | present |
| root artifacts | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/artifacts.json` | present |
| Phase 1-13 | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/phase-*.md` | present |
| strict 7 | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/*.md` | present |
| A-F task specs | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/*.md` | present |
| task-A sub-workflow | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive/` | present |
| task-A standalone root | `docs/30-workflows/task-A-sidebar-shell-primitive/` | collapsed into parent |

## Planned implementation targets

| Target | Purpose |
| --- | --- |
| `apps/web/src/components/shell/**` | New SidebarShell primitive, nav config, user menu, drawer, tests |
| `apps/web/app/(public)/layout.tsx` | Public layout integration |
| `apps/web/app/(member)/layout.tsx` | Member layout integration |
| `apps/web/app/(admin)/layout.tsx` | Admin layout migration |
| `apps/web/src/styles/tokens.css` | Shell tokens |
| `apps/web/tests/e2e/sidebar-shell-smoke.spec.ts` | Role x viewport smoke |
| `apps/web/tests/e2e/sidebar-shell-visual.spec.ts` | Visual baseline |

## Current code anchors

| Anchor | Path |
| --- | --- |
| admin sidebar current nav | `apps/web/src/components/layout/AdminSidebar.tsx` |
| public header | `apps/web/src/components/public/PublicHeader.tsx` |
| member header | `apps/web/src/components/layout/MemberHeader.tsx` |
| sign out | `apps/web/src/components/auth/SignOutButton.tsx` |

## Gates

| Gate | Status | Boundary |
| --- | --- | --- |
| Gate-A | passed | spec / strict 7 / aiworkflow sync |
| Gate-B | pending | apps/web implementation, tests, visual evidence |
| Gate-C | pending | commit, push, PR, CI visual baseline |

## Lessons Learned

参照: `lessons-learned/lessons-learned-unified-sidebar-shell-task-a-2026-05.md`

- **L-USS-001**: parent workflow + nested sub-workflow の topology — standalone root を作らず `tasks/<task-id>/` に nest し `hasCompletedTasksAncestor=true` を維持
- **L-USS-002**: Server / Client component の境界を slot で固定 — `SidebarShellServer` のみ session 解決、`SidebarShell` は plain props + `ReactNode` slot
- **L-USS-003**: `useSidebarState` は SSR 初期値 deterministic — 初期 `collapsed=false`、`useEffect` で localStorage `ubm:shell:collapsed` を hydrate
- **L-USS-003b**: `apps/web` の `localStorage` lint は substring 検出 — `safe-local-storage` util に集約し path allowlist で抜く (現状 `useSidebarState.ts` は lint fail / Gate-B follow-up)
- **L-USS-004**: `buildNavForRole(role, ctx)` を pure 関数化 — viewer=3 / member=4 / admin=13、`shell-config.spec.ts` で全 branch 網羅
- **L-USS-005**: Task B 先行実装でも Task A 契約は崩さない — UserMenu props は slot に閉じ、上流の test を守る
- **L-USS-006**: tokens.css は `[data-theme='cool']` variant 同時追加 — `verify-design-tokens` fail と cool theme drift を予防
