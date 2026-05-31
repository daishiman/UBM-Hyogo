---
spec_classification: implementation_spec
state: spec_created
phase: 9
phase_name: QA / CI gate
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 9: QA / CI gate

## 9.1 必須 green ゲート

| gate | コマンド | 期待 |
|------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | green |
| lint | `mise exec -- pnpm lint` | green |
| verify-test-suffix | CI workflow `verify-test-suffix` | green（新規 test は `SidebarMobileTrigger.spec.tsx` / `SidebarDrawer.spec.tsx` の `.spec.tsx` のみ。`.test.tsx` 不在） |
| verify-design-tokens | CI workflow `verify-design-tokens` | green（AC-E4 token 経由 / backdrop 含む HEX 0 件） |
| vitest unit (useFocusTrap) | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/lib/a11y/__tests__/useFocusTrap` | green |
| vitest unit (SidebarDrawer) | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarDrawer` | green |
| vitest unit (SidebarMobileTrigger) | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarMobileTrigger` | green |
| vitest regression (Drawer 内部 refactor) | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/ui/__tests__/primitives.component` | green（公開 API 不変・無改修で通過） |
| coverage threshold | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | threshold drop なし |

## 9.2 ローカル手動確認

- `mise exec -- pnpm --filter @ubm-hyogo/web dev` を起動
- Chrome DevTools の device toolbar で viewport を 375px / 768px / 1280px に切替確認:
  - 375px: `<aside>` 非表示・hamburger 表示・タップで drawer 開閉・Esc / backdrop で close
  - 768px: 375px と同様（md 未満のため drawer 系が有効）
  - 1280px: `<aside>` 表示・hamburger 非表示・drawer は unmount
- visual baseline（snapshot）取得は Task F に委譲。本 Phase では目視のみ。

## 9.3 AC 突合

| AC | 確認コマンド / 方法 |
|----|---------------------|
| AC-E1 | `grep -nE 'hidden\s+md:flex' apps/web/src/components/shell/SidebarShell.tsx`（`<aside>`）/ `grep -nE 'md:hidden' apps/web/src/components/shell/SidebarMobileTrigger.tsx`（hamburger） |
| AC-E2 | `SidebarMobileTrigger.spec.tsx`: click → `setDrawerOpen(true)` が呼ばれる（context mock の spy 検証） |
| AC-E3 | `SidebarDrawer.spec.tsx`: `getByRole('dialog')` が存在し `aria-modal="true"` を持つ |
| AC-E4 | `SidebarDrawer.spec.tsx`: Esc keydown / backdrop click → `onClose`（= `setDrawerOpen(false)`）が呼ばれる |
| AC-E5 | drawerOpen 時に `document.body` が `data-shell-drawer-open="true"` を持つ（spec で body 属性検証）+ global CSS に scroll lock ルール存在を grep |
| AC-E6 | `useFocusTrap.spec.tsx`: Tab 両境界ループ / 初期 focus / previousFocus 復帰（trap の真実）+ `SidebarDrawer.spec.tsx`: 初期 focus が当たる hook 結線 smoke |
| I-E6（trap 単一 source） | `grep -rn 'addEventListener.*keydown\|previousFocus' apps/web/src/components/shell/SidebarDrawer.tsx`（**出力 0**＝SidebarDrawer に trap 本体なし）+ `grep -rn 'useFocusTrap' apps/web/src/components/ui/Drawer.tsx apps/web/src/components/shell/SidebarDrawer.tsx`（双方が hook を import） |
| AC-E7 | `SidebarDrawer.spec.tsx`: `usePathname` mock 値を変更 → re-render で drawer が auto-close（`onClose` 呼び出し or unmount） |
| AC-E8 | `SidebarDrawer.spec.tsx`: drawer 内 nav link click → close（`onClose`）が呼ばれる |
| AC-E9 | `SidebarMobileTrigger` / `useSidebarState` 側 spec: matchMedia `<1024px` mock → 初期 collapsed / `>=1024px` mock → expanded。`localStorage['ubm:shell:collapsed']` 存在時はそちらを優先 |
| AC-E10 | `useSidebarState` spec: matchMedia 呼び出しが 1 回限り（mock の call count = 1）/ SSR 経路で `browserDocument()` null 時に matchMedia 未参照 |
| AC-E11 | class 文字列 grep（`md:hidden`）+ spec: md+ viewport 相当の条件で drawer が DOM に mount されない |

## 9.4 失敗時の対処

- typecheck fail: `useSidebarShellContext` / `useSidebarState` の戻り値 shape（`{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }`）と import パスの整合を確認
- verify-design-tokens fail: backdrop の HEX 残存を `grep -nE '(bg|text|border)-\[#' apps/web/src/components/shell/SidebarDrawer.tsx apps/web/src/components/shell/SidebarMobileTrigger.tsx` で特定し token 化
- vitest fail: `usePathname`（next/navigation）と `useSidebarShellContext` の mock が provider/route 変化を再現できているか確認。`getByRole('dialog')` が拾えない場合は `aria-modal` / `role` 属性の付与位置を確認
- SSR / matchMedia fail: `browserDocument()`（`apps/web/src/lib/is-browser.ts`）が null を返す経路で matchMedia / body 属性アクセスが guard されているか確認（AC-E10）
