# 20260529 admin-layout-sidebar-shell-migration

`admin-layout-sidebar-shell-migration` を `implemented_local_runtime_pending / implementation / VISUAL` として同期。
parent `unified-sidebar-shell-public-and-admin` の child workflow。

## Summary

- workflow root: `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/`
- Task D を形式化（`apps/web/app/(admin)/layout.tsx` を旧 `AdminSidebar` ownership → 新 `SidebarShellServer` ownership へ移行）
- ユーザー承認（CONST_009）で blocking Task A（`SidebarShellServer`）/ Task B（`SidebarUserMenu`）/ Task E 最小（`SidebarMobileTrigger`）も同一 wave で実装

## Implemented Targets

- added: `apps/web/src/components/shell/**`（15 component + 6 spec）
- added: `apps/web/src/lib/admin/schema-diff-count.ts`(+spec)（schemaDiffCount SSOT / TECH-M-01）
- edited: `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(admin)/layout.spec.tsx`, `apps/web/src/styles/tokens.css`（shell トークン 6 件）
- deleted: `apps/web/src/components/layout/AdminSidebar*`（6 file: Sidebar / Brand / NavItem + tests, grep 0 hit）

## Invariants

API endpoint / D1 schema / Google Form / Auth.js mechanism は不変。admin auth guard と `/login?next=/admin` / `/login?gate=forbidden` redirect を維持。
`/admin/schema/diff` call は既存挙動の relocation（`schema-diff-count.ts`）であり contract 変更ではない。`docs/00-getting-started-manual/specs/*.md` 更新不要。

## Local Evidence

- typecheck: 6/6 green
- lint: OK
- web Vitest: 1299 passed
- AC-2 grep: 0 hit
- Phase 12 strict 7 present / root・output artifacts parity present / gates は `metadata.gates` 配下

## Skill Sync（同一 wave）

quick-reference / resource-map / topic-map / keywords.json / task-workflow-active / artifact-inventory（新規）/ LOGS / SKILL-changelog / 本 dated changelog / lessons-learned（新規 L-ALSSM-001..005）/ lessons-learned hub。

## User Gate

staging visual capture（Phase 11 screenshots）/ commit / push / PR。

## Follow-up

FU-ALSSM-001: sidebar collapse 状態の永続化（cookie 方式）。`scripts/lint-boundaries.mjs` の storage forbidden 制約により in-memory に限定したため分離。GitHub Issue #1024 起票済み（type:followup / priority:low / wave:2-plus / scale:small）。
