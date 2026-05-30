---
task: unified-sidebar-shell-task-e-mobile-drawer-responsive
scope: Task A (prerequisite, full) + Task E
created_at: 2026-05-29
---

# 実装サマリ（Phase 5〜10）

## 前提判断（エスカレーション結果）

Task E は親 workflow Task A（`SidebarShell` primitive）を前提とするが、現ブランチに `apps/web/src/components/shell/` が
存在しなかった。ユーザーへエスカレーションし「**Task A をフル実装してから Task E**」の方針を取得。
Task A（14 新規 + tokens 編集）→ Task E（5 新規 + 3 編集）の順で同一サイクル内に実装した。

## Phase 5: 実装手順の遂行

実装順は spec 5.1 通り `useFocusTrap`（単一 source）→ `Drawer.tsx` refactor → shell 系。

- Task A: `shell-config.ts` / `icons.tsx` / `useSidebarState.ts` / `SidebarShellContext.tsx` / nav 4 component / `SidebarBrand` / `SidebarCollapseToggle` / `SidebarShell.tsx` / `SidebarShell.server.tsx` / tokens.css
- Task E: `useFocusTrap.ts` / `SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx` / `useSidebarState.ts`（route close + 初期 collapsed） / `SidebarShell.tsx`（aside hidden + strip + drawer mount） / `Drawer.tsx`（trap hook 委譲） / globals.css（scroll lock）

## Phase 6: テスト追加

| spec | tests | 対象 AC |
|------|-------|---------|
| `shell-config.spec.ts` | 9 | Task A nav 構成 / active 判定 |
| `useSidebarState.spec.tsx` | 9 | Task A 基盤 4 + AC-E9/E10（5） |
| `SidebarShell.spec.tsx` | 7 | AC-E1 / E7 / E8 / E11 / R-E2 + nav rendering |
| `useFocusTrap.spec.tsx` | 6 | AC-E4 / E6 全 branch（trap 真実） |
| `SidebarMobileTrigger.spec.tsx` | 3 | AC-E1 / E2 |
| `SidebarDrawer.spec.tsx` | 7 | AC-E3〜E6 / E11 + 結線 smoke |

→ 新規 41 tests + 既存回帰（Drawer 系 33）= 全 PASS。`*.spec.{ts,tsx}` のみ（不変条件 #8 遵守）。

## Phase 7: カバレッジ

trap の全 branch（Tab 両境界 / focusables 0 / SSR no-op / previousFocus）は `useFocusTrap.spec` に集約。
`SidebarDrawer.spec` は hook 結線 smoke のみに留めテスト重複を回避（I-E6 の精神をテスト層へ適用）。

## Phase 8: リファクタ

- focus trap を `useFocusTrap` 単一 source へ抽出。`Drawer.tsx` / `SidebarDrawer.tsx` が共有（複製ゼロ）
- `MenuIcon` は `icons.tsx` に単一定義
- backdrop / 幅 / 背景は token（`--shell-overlay` / `--shell-bar-w` / `--shell-bar-bg`）経由・HEX ゼロ
- scroll lock は `body[data-shell-drawer-open]` 属性 + CSS の 1 系統（`body.style` 直書きなし）
- hover 背景の token 参照は fallback 付き（`var(--ubm-color-surface-hover,var(--ubm-color-surface-bg-2))`）。`--ubm-color-surface-hover` は設計トークン SSOT（09b）未定義のため、定義追加（`missing-in-09b` gate 違反）を避けつつ hover affordance を担保（Phase-12 レビュー時の局所修正・対象は新 shell 3 component）

## Phase 9: QA / CI gate（ローカル）

| gate | 結果 |
|------|------|
| focused vitest（shell + a11y 新規 spec） | 41 PASS（6 files。primitives 回帰 26 込みの focused run は 67 PASS / 7 files = `phase-6/focused-vitest.log`） |
| Drawer 回帰（primitives + 2 consumer） | 33 PASS |
| `pnpm --filter @ubm-hyogo/web typecheck` | green |
| eslint（変更ファイル） | green |
| `pnpm run verify:tokens`（color literal scan 込み） | ✓ 91 tracked / 0 drift |

## Phase 10: 最終レビュー

- 公開 API 不変: `Drawer` props `{open,onClose,title,children}` と DOM 出力不変 → consumer 無改修 green
- state owner 単一化: `useSidebarState` のみ（I-E2）
- API/D1/auth 不変（I-E3）: 該当ファイルに変更なし
- 残課題: ライブ screenshot（Task C/D mount 依存）/ visual baseline（Task F）/ UserMenu 差し替え（Task B）。
  いずれも sibling task の責務境界による構造的依存であり、本タスク単独スコープでは完了対象外。
