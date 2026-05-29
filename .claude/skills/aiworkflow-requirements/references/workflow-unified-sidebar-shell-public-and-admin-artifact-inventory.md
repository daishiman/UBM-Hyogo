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
| Gate-B | partial | Task A + Task E は apps/web 実装 landed・focused vitest 67 PASS / typecheck / lint / verify:tokens 91-0 green（`unified-sidebar-shell-task-e-mobile-drawer-responsive`）。Task C/D/F の mount・visual baseline は未実装。ライブ route screenshot は C/D mount 依存で pending |
| Gate-C | pending | commit, push, PR, CI visual baseline（user-gated） |

## Lessons Learned

詳細: [[lessons-learned-unified-sidebar-shell-task-e-focus-trap-responsive-2026-05]]

- **L-USSTE-001**: dialog focus trap は `apps/web/src/lib/a11y/useFocusTrap.ts` の単一 source に集約。`Drawer.tsx`（内部 refactor・公開 API 不変）と `SidebarDrawer.tsx` が共有し複製ゼロ（Phase 5/8/10/I-E6 の三すくみ解消）。
- **L-USSTE-002**: scroll lock は `body[data-shell-drawer-open]` 属性 + CSS（`globals.css`）の 1 系統。`body.style` 直書きを避け hydration mismatch を回避。
- **L-USSTE-003**: breakpoint 表示は Tailwind `md:` を正本、`matchMedia('(min-width:1024px)')` は初回 effect の 1 回限り（初期 collapsed 判定のみ・resize 非追従・SSR no-op）。
- **L-USSTE-004**: `<aside>` と overlay drawer は同一 `sidebarTree` 変数を共有しつつ固定 id を置かない。排他は CSS（`hidden md:flex` / `md:hidden`）と `open=false→null` unmount で担保（R-E2）。
- **L-USSTE-005**: 実装 landed 後は spec_only 前提の compliance-check / evidence / 数値を実態へ逆流同期し、`state: spec_created`（spec ライフサイクル）と実装完了を明示区別。`aggregated-at-parent` claim は親に実体を置いて真にする。
- **L-USSTE-006**: 未定義 `--ubm-*` 色トークンの参照は `var(--target,var(--defined-fallback))` 形式で書く。tokens.css へ定義追加すると `verify-design-tokens` の `missing-in-09b` で fail するため、SSOT 追加は 09b 同 wave 更新の独立タスクに切り出す。
