# Workflow Artifact Inventory — issue-1016-sidebar-mobile-drawer-responsive

## Summary

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| issue | #1016 CLOSED。PR 文脈は `Refs #1016` のみ |
| parent | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/` Task E |

## Implementation Targets

| 種別 | Path |
| --- | --- |
| new component | `apps/web/src/components/shell/SidebarMobileTrigger.tsx` |
| new component | `apps/web/src/components/shell/SidebarDrawer.tsx` |
| state wiring | `apps/web/src/components/shell/useSidebarState.ts` |
| shell mount | `apps/web/src/components/shell/SidebarShell.tsx` |
| browser boundary | `apps/web/src/lib/is-browser.ts` |
| scroll lock CSS | `apps/web/src/styles/globals.css` |
| focused tests | `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx` |
| focused tests | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` |
| focused tests | `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` |
| regression tests | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` |

## Evidence

| Evidence | Path / Result |
| --- | --- |
| focused Vitest | `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/outputs/phase-11/evidence/focused-vitest.log` |
| result | 4 files / 21 tests PASS |
| screenshots | `outputs/phase-11/screenshots/*.png` present（375 / 768 / 1280 local visual-harness capture） |
| screenshot metadata | `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/outputs/phase-11/metadata.json` |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/outputs/phase-12/` |
| artifacts parity | root `artifacts.json` and `outputs/artifacts.json` byte-identical |

## Boundaries

- No new API endpoint, D1 schema, Google Form contract, Auth.js middleware, or package dependency.
- `browserMatchMedia()` is the sole new browser-boundary helper; shell code does not call `window.matchMedia` directly.
- Staging runtime verification, commit, push, and PR remain user-gated.

## Lessons Learned

参照: `lessons-learned/lessons-learned-issue-1016-sidebar-mobile-drawer-responsive-2026-05.md`（L-I1016-001..007）。親 Task A の `lessons-learned-unified-sidebar-shell-task-a-2026-05.md`（L-USS-001..005）を踏襲。

- **L-I1016-001** Implementation Target Physical Existence Gate を CLOSED Issue follow-up でも適用 — 実装可能な target があれば `spec_created` 散文で close しない。
- **L-I1016-002** 先行未消費 state（`drawerOpen` / `setDrawerOpen`）は同一 feature surface（Trigger / Drawer）で消費先を実装してから close。別 backlog を増やさない。
- **L-I1016-003** client-only responsive helper は既存 browser boundary（`is-browser.ts` の `browserMatchMedia()`）に集約し、feature component から `window.matchMedia` を直呼びしない。
- **L-I1016-004** VISUAL の status は local screenshot `present` / staging visual `pending` を二段階分離追跡する。
- **L-I1016-005** Phase 3 MINOR は current（横展開未タスク）と baseline（本サイクル解消）に分離。本件 M-1/M-2/M-3 は全て baseline → current 0 件。
- **L-I1016-006** 識別子（型 / `data-*` / breakpoint / storage key / dialog id）は implementation-guide で phase-02-design から逐語引用し drift を防ぐ。
- **L-I1016-007** modal/drawer scrim は sibling backdrop + token color + `opacity-40` で新 token を増やさない。
