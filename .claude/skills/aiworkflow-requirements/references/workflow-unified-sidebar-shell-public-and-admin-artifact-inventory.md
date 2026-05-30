# workflow-unified-sidebar-shell-public-and-admin artifact inventory

作成日: 2026-05-28

## Summary

`unified-sidebar-shell-public-and-admin` is a `spec_created / implementation / VISUAL` workflow. It defines a unified collapsible sidebar shell for public, member, and admin route groups. Implementation and runtime visual evidence are pending Gate-B/C.

## Canonical workflow

| Artifact | Path | Status |
| --- | --- | --- |
| root | `docs/30-workflows/unified-sidebar-shell-public-and-admin/` | present |
| index | `docs/30-workflows/unified-sidebar-shell-public-and-admin/index.md` | present |
| root artifacts | `docs/30-workflows/unified-sidebar-shell-public-and-admin/artifacts.json` | present |
| output artifacts | `docs/30-workflows/unified-sidebar-shell-public-and-admin/outputs/artifacts.json` | present |
| Phase 1-13 | `docs/30-workflows/unified-sidebar-shell-public-and-admin/phase-*.md` | present |
| strict 7 | `docs/30-workflows/unified-sidebar-shell-public-and-admin/outputs/phase-12/*.md` | present |
| A-F task specs | `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/*.md` | present |

## Planned implementation targets

| Target | Purpose |
| --- | --- |
| `apps/web/src/components/shell/**` | New SidebarShell primitive, nav config, user menu, drawer, tests |
| `apps/web/app/(public)/layout.tsx` | Public layout integration |
| `apps/web/app/(member)/layout.tsx` | Member layout integration |
| `apps/web/app/(admin)/layout.tsx` | Admin layout migration |
| `apps/web/src/styles/tokens.css` | Shell tokens |
| `apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts` | Role x viewport smoke (S1-S6, Task F implemented) |
| `apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts` | Visual baseline (V1-V7, Task F implemented) |
| `apps/web/playwright/tests/sidebar-shell/_helpers.ts` | Shared shell helpers (Task F) |

## Current code anchors

> 実装は本ブランチで landed。旧 per-layer shell（`AdminSidebar.tsx` / `PublicHeader.tsx` / `MemberHeader.tsx`）は削除済みで、共通 `SidebarShell` へ統合された。

| Anchor | Path |
| --- | --- |
| unified shell (server) | `apps/web/src/components/shell/SidebarShell.server.tsx` |
| unified shell (client) | `apps/web/src/components/shell/SidebarShell.tsx` |
| shell config / nav | `apps/web/src/components/shell/shell-config.ts`, `SidebarNav.tsx`, `SidebarNavItem.tsx` |
| user menu | `apps/web/src/components/shell/SidebarUserMenu.tsx`, `user-menu-config.ts` |
| drawer / collapse state | `apps/web/src/components/shell/{SidebarDrawer,useSidebarState}.ts(x)` |
| sign out | `apps/web/src/components/auth/SignOutButton.tsx` |
| layouts | `apps/web/app/(public|member|admin)/layout.tsx` |
| Task F Playwright specs | `apps/web/playwright/tests/sidebar-shell/{sidebar-shell-smoke,sidebar-shell-visual,_helpers}.{ts,spec.ts}` |

## Gates

| Gate | Status | Boundary |
| --- | --- | --- |
| Gate-A | passed | spec / strict 7 / aiworkflow sync |
| Gate-B | pending | CI Linux `-linux.png` visual baseline 撮影 + regression dry-run（apps/web 実装・local vitest 45 / smoke 6/6 / visual V1-V3 は landed） |
| Gate-C | pending | commit, push, PR, CI visual baseline commit |

## Lessons Learned

実装 + 本レビューサイクルの知見は `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-unified-sidebar-shell-2026-05.md`（L-USHELL-001..007）に体系化。

- **L-USHELL-001**: 公開/会員/管理 3 route group を共通 `SidebarShellServer` へ集約し role 判定を `getSession().isAdmin` の 1 箇所に一本化（throw 時 `viewer` fail-closed・不変条件 #11）。
- **L-USHELL-002**: nav active 判定は client `usePathname()` + `isNavItemActive` 純関数に寄せ、server からの `activePath` 配線は middleware の header 注入とセットでない限り dead code（本実装で削除）。
- **L-USHELL-003**: Playwright auth fixture の `anonymousPage` は `mockApi` 非依存。anonymous 系 smoke/visual は `mockApi` を明示注入する（未注入だと public home が error boundary に落ち `waitShellReady` timeout）。
- **L-USHELL-004**: 複数 layout を同時に async server 化する際は N 個すべての対応 spec を追従更新する（`(member)/layout.spec.tsx` 追従漏れで 2 件 fail を検出）。
- **L-USHELL-005**: collapse 永続化（`localStorage["ubm:shell:collapsed"]`）と drawer auto-close は client state hook（`useSidebarState`）に閉じ、`isBrowser()` guard で SSR 安全化。
- **L-USHELL-006**: 旧 per-layer shell 削除 + route group 移動はシステム仕様書 dangling（09h / 05-pages / 00-overview / 09g / 09-ui-ux route group prefix）を同 wave で解消する。
- **L-USHELL-007**: Phase-12 compliance の「lint green」主張は close-out 時に `pnpm lint` 再実行で検証する。本サイクルで 3 件の landed lint regression を検出・修正（`localStorage` boundary → `@ubm-hyogo/shared/browser-storage` 隔離 / inline `style={` → token-var arbitrary className / `no-restricted-globals` eslint-disable 復元）。lint は `&&` serial chain のため green まで反復（3 iteration）。
