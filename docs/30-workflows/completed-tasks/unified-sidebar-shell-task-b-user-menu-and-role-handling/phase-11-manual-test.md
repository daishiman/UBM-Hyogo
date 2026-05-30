# Phase 11: 手動テスト / VISUAL evidence

## 状態

`completed`。apps/web 実装、focused Vitest、grep gate、local Chromium screenshot evidence を 2026-05-29 に取得済み。

## 4. Phase 11 evidence file inventory

| # | Evidence | Path | Status |
| --- | --- | --- | --- |
| 1 | manual result | `outputs/phase-11/manual-test-result.md` | present |
| 2 | screenshot plan | `outputs/phase-11/screenshot-plan.json` | present |
| 3 | focused vitest log（user-menu-config） | `outputs/phase-11/user-menu-config.spec.log` | present |
| 4 | focused vitest log（SidebarUserMenu） | `outputs/phase-11/sidebar-user-menu.spec.log` | present |
| 5 | viewer popover screenshot | `outputs/phase-11/screenshots/user-menu-viewer.png` | present |
| 6 | member popover screenshot | `outputs/phase-11/screenshots/user-menu-member.png` | present |
| 7 | admin popover screenshot | `outputs/phase-11/screenshots/user-menu-admin.png` | present |
| 8 | collapsed avatar screenshot | `outputs/phase-11/screenshots/user-menu-collapsed.png` | present |
| 9 | grep gate log | `outputs/phase-11/evidence/grep-gate.log` | present |
| 10 | visual run log | `outputs/phase-11/sidebar-user-menu.visual.log` | present |

## 取得手順（実行済み）

1. `pnpm exec vitest run --config=vitest.config.ts apps/web/src/components/shell/__tests__/user-menu-config.spec.ts 2>&1 | tee outputs/phase-11/user-menu-config.spec.log`
2. `pnpm exec vitest run --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx 2>&1 | tee outputs/phase-11/sidebar-user-menu.spec.log`
3. `PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3007 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/evidence pnpm --filter @ubm-hyogo/web exec playwright test --project=visual-chromium playwright/tests/visual/sidebar-user-menu.spec.ts 2>&1 | tee outputs/phase-11/sidebar-user-menu.visual.log`
4. §Phase 8 grep gates をまとめて `outputs/phase-11/evidence/grep-gate.log` へ tee

## 完了条件

10 evidence が `present`。runtime visual baseline の CI 比較は親 Task F 経由で継続する。
