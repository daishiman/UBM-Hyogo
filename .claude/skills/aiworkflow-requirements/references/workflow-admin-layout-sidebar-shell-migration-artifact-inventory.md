# workflow-admin-layout-sidebar-shell-migration artifact inventory

作成日: 2026-05-29 / 実装完了: 2026-05-29

## Summary

`admin-layout-sidebar-shell-migration` is an `implemented_local_runtime_pending / implementation / VISUAL` child workflow under `unified-sidebar-shell-public-and-admin`.
It formalizes Task D (migrate `apps/web/app/(admin)/layout.tsx` from the old `AdminSidebar` ownership model to the new `SidebarShellServer` ownership model).
Per user approval (CONST_009), this wave also implemented the blocking Task A (`SidebarShellServer`), Task B (`SidebarUserMenu`), and the minimal Task E (`SidebarMobileTrigger`).
Local evidence is green; staging visual capture and commit/push/PR remain user-gated.

## Canonical Workflow

| Artifact | Path | Status |
| --- | --- | --- |
| root | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/` | present |
| index | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/index.md` | present |
| root artifacts | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/artifacts.json` | present |
| implementation summary | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/implementation-summary.md` | present |
| Phase 1-13 | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/phase-*.md` | present |
| strict 7 | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/phase-12/*.md` | present |
| source task | `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-D-admin-layout-migration.md` | present |

## Implemented Targets

| Target | Action | Purpose |
| --- | --- | --- |
| `apps/web/src/components/shell/**`（15 component + 6 spec） | added | Task A/B/E shell primitives（`SidebarShellServer` / `SidebarShell` / nav / brand / user menu / mobile trigger / config / state hook） |
| `apps/web/src/lib/admin/schema-diff-count.ts`(+spec) | added | schemaDiffCount SSOT（TECH-M-01） |
| `apps/web/app/(admin)/layout.tsx` | edited | auth guard + `SidebarShellServer` 委譲 + admin shell DOM contract + `<main data-route="admin">` |
| `apps/web/app/(admin)/layout.spec.tsx` | edited | TC-01/02/03/07/08（auth redirects / DOM contract / single main / axe） |
| `apps/web/src/styles/tokens.css` | edited | shell トークン 6 件 |
| `apps/web/src/components/layout/AdminSidebar*.tsx`（6 files） | deleted | 旧 sidebar 完全除去（grep 0 hit） |

## Dependency Gates

| Dependency | Status | Reason |
| --- | --- | --- |
| Task A `SidebarShellServer` | resolved (this wave) | implemented under `apps/web/src/components/shell/SidebarShell.server.tsx` |
| Task B `SidebarUserMenu` | resolved (this wave) | implemented under `apps/web/src/components/shell/SidebarUserMenu.tsx` |
| Task E (minimal) `SidebarMobileTrigger` | resolved (this wave) | mobileTriggerSlot drawer trigger implemented |

## Current Boundary

| Gate | Status | Boundary |
| --- | --- | --- |
| Gate-A | passed | spec package, strict 7, aiworkflow ledger sync |
| Gate-B | passed | apps/web implementation + local evidence（typecheck 6/6, lint, web Vitest 1299 passed, AC-2 grep 0）。staging visual capture は user-gated |
| Gate-C | pending | commit, push, PR（user-gated） |

## Follow-up

- FU-ALSSM-001: sidebar collapse 状態の永続化（cookie 方式）。`scripts/lint-boundaries.mjs` の storage forbidden 制約により in-memory に限定したため分離。**GitHub Issue #1024 起票済み**（type:followup / priority:low / wave:2-plus）。

## Lessons Learned

`.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-admin-layout-sidebar-shell-migration-2026-05.md`（L-ALSSM-001..005）:

- L-ALSSM-001: scope 拡張で実装が走ったら state 伝播 SSOT セット（index frontmatter / root+output artifacts.json / Phase 12 strict 7 / aiworkflow ledger）を同一 wave で一括更新する。
- L-ALSSM-002: Phase 12 implementation-guide の code sample は実装完了直後に実ファイルから引き写す（`session.isAdmin` / `activePath`+`mobileTriggerSlot` / `safeServerFetch` discriminated-union）。
- L-ALSSM-003: child workflow が parent primitive を削除したら parent ledger の present-tense reference のみ補正し、dated 過去エントリは point-in-time record として触らない。
- L-ALSSM-004: artifacts.json の gates は `metadata.gates` 配下にのみ置く（top-level は WARN skip で non-normative）。
- L-ALSSM-005: storage 禁止制約に当たった機能は in-memory へ縮退し、永続化は CONST_008 に従い別 Issue へ分離（FU-ALSSM-001 / Issue #1024）。
