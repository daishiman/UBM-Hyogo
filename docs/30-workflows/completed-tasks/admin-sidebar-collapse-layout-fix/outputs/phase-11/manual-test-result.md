# Phase 11 Manual Test Result — admin-sidebar-collapse-layout-fix

workflow_state: `implemented_local_evidence_captured` / generated_at: 2026-06-08

## メタ情報（証跡の主ソースと境界）

- **証跡の主ソース**: 実コード差分、focused Vitest、local Playwright screenshot 3 件、Phase 12 compliance check。
- **local screenshot**: `outputs/phase-11/screenshots/TC-11-1-sidebar-collapsed-desktop.png` / `TC-11-2-sidebar-expanded-desktop.png` / `TC-11-3-sidebar-collapsed-user-menu-open.png` を取得済み。TC-11-3 は popover が aside 外へ出るため viewport screenshot。
- **二層 evidence の分離**: local fixture screenshot は取得済み。staging 認証済み baseline は Phase 13 user-gated として分離する。

## Summary

| Gate | Status | Evidence |
| --- | --- | --- |
| Local focused vitest | PASS | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx`（3 files / 30 tests PASS） |
| Local fixture visual screenshot | PASS | local Playwright Chromium で `outputs/phase-11/screenshots/*.png` 3 件を配置 |
| Staging visual screenshot | PENDING_STAGING_BASELINE | staging 認証済み screenshot は Phase 13 user-gated で生成する |
| apps/api unchanged | PASS | `git diff --name-only -- apps/api` が空（AC-8） |

## 取得済み screenshot 一覧

| テストケース | 画面 / 状態 | viewport | 配置先 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-11-1 | collapsed sidebar 全景（中央揃え・はみ出し解消） | 1280x800 | `screenshots/TC-11-1-sidebar-collapsed-desktop.png` | AC-1 / AC-2 / AC-3 / AC-4 |
| TC-11-2 | expanded sidebar 全景（regression なし） | 1280x800 | `screenshots/TC-11-2-sidebar-expanded-desktop.png` | AC-5 |
| TC-11-3 | collapsed + user-menu open（意味的可視性・tooltip clip 実機確認） | 1280x800 | `screenshots/TC-11-3-sidebar-collapsed-user-menu-open.png` | AC-6 + OOS-1 |

## Visual Runtime Boundary

collapsed 時の中央揃え・水平パディング除去・固定枠でのはみ出し解消・縦中心線の一致は Tailwind className の効きであり、
jsdom（focused vitest）では class / 属性付与までしか保証できない。描画結果は local fixture screenshot で確認済み。
staging 認証済み環境の実 sidebar 描画（公開 / 会員 / 管理の 3 層共通 shell）は real baseline として Phase 13 user-gated に残す。
OOS-1（collapsed hover tooltip が `[data-shell="sidebar"]{overflow:hidden}` で clip されるか）は TC-11-3 の実機目視で判定し、
clip 確認かつ改善判断になった場合のみ別タスク化を検討する（`outputs/phase-12/unassigned-task-detection.md` の baseline 参照）。
