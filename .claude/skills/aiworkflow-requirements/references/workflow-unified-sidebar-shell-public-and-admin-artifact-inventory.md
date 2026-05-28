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
| Gate-B | pending | apps/web implementation, tests, visual evidence |
| Gate-C | pending | commit, push, PR, CI visual baseline |
