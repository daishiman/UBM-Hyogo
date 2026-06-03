# Workflow Artifact Inventory — sidebar-visibility-conditional-and-ux

`sidebar-visibility-conditional-and-ux` is registered as
`implemented_local_evidence_captured / implementation / VISUAL`.

## Artifacts

| Artifact | Path | Status |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/` | present |
| index | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/index.md` | present |
| root artifacts | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/outputs/artifacts.json` | present |
| Phase 1-13 | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/phase-*.md` | present |
| Phase 11 result | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/outputs/phase-11/manual-test-result.md` | present |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/outputs/phase-12/` | present |

## Implementation

| Area | Files |
| --- | --- |
| route topology | `apps/web/app/(auth)/layout.tsx`, `apps/web/app/(auth)/login/**`, removed `apps/web/app/(public)/login/` |
| SSR active path | `apps/web/middleware.ts`, `apps/web/app/(admin)/layout.tsx` |
| shell UX | `apps/web/src/components/shell/{SidebarUserMenu,SidebarUserAvatar,SidebarNavItem,user-menu-config}.tsx` |
| tests | `apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts`, `apps/web/__tests__/middleware.spec.ts`, `apps/web/app/(admin)/layout.spec.tsx`, shell/login specs |
| system spec | `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` |

## Evidence

| Evidence | Result |
| --- | --- |
| direct focused Vitest | 20 files / 98 tests PASS |
| typecheck | PASS |
| lint | PASS |
| grep gates | `(auth)` login present, `(public)/login` absent, `x-pathname` injected, `activePath="/admin"` absent, HEX gate clean |
| local screenshots | 4 PNG present: `login-bare.png`, `sidebar-viewer-guest.png`, `sidebar-viewer-guest-mobile.png`, `sidebar-mobile-drawer.png` |

Staging/admin visual baseline, commit, push, and PR remain user-gated.

## Lessons Learned

参照: `lessons-learned/lessons-learned-sidebar-visibility-conditional-and-ux-2026-06.md`（L-SVC-001..004）。sibling `issue-1016-sidebar-mobile-drawer-responsive` / parent `unified-sidebar-shell-*` の shell lesson 系譜を踏襲。

- **L-SVC-001** Spec drift bug は新仕様創作ではなく正本（09h §1.6）への実装一致として扱う — Phase 1 で「正本仕様 / 現実装 / 差分修正」を分離する。
- **L-SVC-002** shell 表示条件は layout 内分岐ではなく route group が単一所有する — `(auth)` bare / `(public)`・`(member)`・`(admin)` shell とし invariant test で固定。
- **L-SVC-003** VISUAL task は local deterministic evidence（focused Vitest / typecheck / lint / grep）と pixel evidence（認証済み staging screenshot）を分離し、`implemented_local_evidence_captured` + `pixel_screenshot_pending_user_gate` を併記する。
- **L-SVC-004** role→nav 契約は item 数・route・外部リンクまで 09h §1.2 と正本同期し、static invariant test で古い item 数表記を検出する。
