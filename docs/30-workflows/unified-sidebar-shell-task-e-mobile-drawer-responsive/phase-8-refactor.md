---
spec_classification: implementation_spec
state: spec_created
phase: 8
phase_name: リファクタ
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 8: リファクタ

## 8.1 同サイクル内のリファクタ範囲

| 項目 | 内容 | 範囲 |
|------|------|------|
| (a) focus trap ロジックの単一 source 化 | focus-trap（初期 focus / Tab ループ / Esc / previousFocus 復帰）を `apps/web/src/lib/a11y/useFocusTrap.ts` へ**抽出**し、`Drawer.tsx`（内部 refactor）と `SidebarDrawer.tsx` の双方が同一 hook を呼ぶ (I-E6)。`SidebarDrawer` 側に trap を再実装せず、backdrop / scroll-lock / md:hidden / token 幅のみを hook の外側に置く | `useFocusTrap.ts`（新規・単一 source）+ `Drawer.tsx`（trap を hook 呼び出しへ置換・公開 API 不変）+ `SidebarDrawer.tsx`（hook 委譲）。**hook 抽出が正解**である理由: trap が 2 component に重複すると I-E6 の WHY（画面ごとに trap を作ると a11y 回帰の温床）が再発するため、単一 source 化が根治。`Drawer` は wrap では title 必須・backdrop/className 不在で SidebarDrawer 要件を満たせないが、trap だけを hook 共有すれば公開 API を一切変えずに重複ゼロを達成できる |
| (b) `MenuIcon` の最小追加 | `apps/web/src/components/shell/icons.tsx`(または既存 icons 定義元) に `MenuIcon` が未定義の場合のみ、既存 icon と同形式 (SVG + `aria-hidden` 既定) で最小追加 | icons 定義 1 箇所。既存 icon の形状・props 契約は変更しない。既に定義済みなら touched しない |
| (c) backdrop 色・幅を token 経由に統一 | `SidebarDrawer.tsx` の backdrop overlay 色 / drawer 幅 / 影を shell token (`var(--ubm-shell-*)` または `tokens.css` 既存変数) 経由に統一し、HEX / `bg-[#...]` / 任意 px 直値を残さない (I-E4) | `SidebarDrawer.tsx`。新規トークンが必要な場合のみ `tokens.css` に最小追加 |
| (d) scroll lock を属性 + CSS に統一 | scroll lock は JS の `body.style.overflow` 直書きではなく、`useSidebarState` / `SidebarShell` が `body[data-shell-drawer-open="true"]` 属性を制御し、CSS 側 (`tokens.css` 同階層の global CSS) で `body[data-shell-drawer-open="true"] { overflow: hidden; }` を定義する方式に統一する (AC-E5) | 属性 set/unset 箇所 1 系 + global CSS 1 ルール |

## 8.2 同サイクル外（やらないこと）

- Task A の `useSidebarState` hook 内部の再設計（state 構造・localStorage キー `ubm:shell:collapsed`・戻り値 shape は維持。I-E1 / I-E2）
- 新規 state store / context の追加（owner は `useSidebarState` 1 系のまま。I-E2）
- Task B の `UserMenu` 関連の変更
- resize 追従の `matchMedia` listener / `resize` event listener の追加（breakpoint 正本は CSS `md:` であり、`matchMedia` は初期 collapsed 判定の 1 回限り。I-E5 違反のため禁止）
- 既存 `Drawer.tsx` primitive の**公開 API 変更**（`{ open, onClose, title, children }` と DOM 出力は不変。許容するのは inline trap を `useFocusTrap` 呼び出しへ置換する**内部 refactor のみ**。既存 consumer `MemberDrawer` / `BulkRepublishDrawer` は無改修。I-E6 / R-E7）

## 8.3 完了条件

- `SidebarDrawer.tsx` / `SidebarMobileTrigger.tsx` に HEX / `bg-[#...]` / `text-[#...]` / `border-[#...]` および backdrop の直値色が残らない
- focus 管理が `useFocusTrap` 単一 source に統一され、`Drawer.tsx` / `SidebarDrawer.tsx` に trap ロジック・focusable selector の重複実装がない（grep で trap 本体が hook 1 箇所のみ）
- scroll lock が `body[data-shell-drawer-open]` 属性 + CSS の 1 系統に統一され、`body.style.overflow` の JS 直書きが残らない
- `MenuIcon` が単一定義で参照される（重複定義なし）
- `verify-design-tokens` green
