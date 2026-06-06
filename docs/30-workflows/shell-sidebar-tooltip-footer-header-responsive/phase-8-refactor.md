---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 8
phase_name: リファクタ
created_at: 2026-06-03
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 8: リファクタ

## 8.1 同サイクル内のリファクタ範囲

本タスクは新規コンポーネント追加 + CSS/class 変更が中心で、既存ロジックの構造的負債は少ない。リファクタは「ツールチップ CSS / DOM 契約の単一 source 化」と「複製ゼロの担保」に絞る。

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| (a) | tooltip CSS の単一 source 化 | 4 コントロール（nav item / 公開に戻る / user menu / collapse toggle）が collapsed 時にラベル表示を各自実装すると、位置・色・影・トリガ（`:hover`/`:focus-within`）が複製される | `.ubm-shell-tooltip-wrap` / `.ubm-shell-tooltip` を `globals.css` の shell セクションに **1 定義**だけ置き、4 コントロール全てが同 class を共有する | 同一スタイルが 4 箇所に散ると token 値・z-index・トリガ条件のドリフト温床になる。CSS 1 source 化で根治（I-2 / AC-A4） |
| (b) | tooltip wrap ロジックの単一 source 化 | collapsed 判定 + `cloneElement` での `aria-describedby` 注入 + `role="tooltip"` bubble 生成を各コントロールに inline 実装すると重複する | `SidebarTooltip.tsx` を **唯一の wrap source** とし、`SidebarNavItem` / `AdminPublicReturn`(`SidebarShell`) / `SidebarCollapseToggle` の 3 つは全て `SidebarTooltip` を呼ぶ（trap ロジック / describedby 連結を再実装しない） | wrap ロジックが 3 箇所に重複すると a11y 配線（describedby 連結）のドリフトが起きる。単一 source で AC-A3 / A6 を一元担保 |
| (c) | user menu の inline bubble での CSS class 流用 | `<details>/<summary>` 制約（直下子は `<summary>` 必須）により user menu は `SidebarTooltip` wrap を使えない（D-3）。bubble 用に独自 class を新設すると見た目が他コントロールとズレる | user menu は `<summary>` を `relative` にして内部へ `role="tooltip"` bubble を直接配置するが、**CSS は `.ubm-shell-tooltip` を流用**（wrap だけ inline・class は共有）→ 複製ゼロ | bubble の見た目を 4 コントロールで完全一致させつつ、`<details>` semantics（summary 直下）を守る。class 流用で視覚の複製を作らない（D-3 / AC-A5） |

## 8.2 同サイクル外（やらないこと）

- 汎用 Tooltip primitive の `apps/web/src/components/ui/` 化 → 本タスクは shell 固有 chrome に閉じる（I-3・YAGNI。本サイクルで未使用抽象を増やす必要はないため未タスク化しない）。
- `useSidebarState` / `SidebarShellContext` / drawer / collapse cookie の再設計 → state owner は既存 1 系のまま（I-4）。
- `PublicFooter.tsx` の DOM 変更 → レーン B は `legacy-public.css` の CSS のみで達成（コンポーネントは無改修）。
- icons / shell-config / nav 定義（navigation drift 防止）→ nav item の数・順序・label・aria-current は不変。tooltip 追加は **加算**であり既存 query を壊さない。

## 8.3 navigation drift チェック

- nav item の数・順序・遷移先・accessible name（sr-only ラベル / aria-current）は変更しない。tooltip は description（`aria-describedby`）として付与するのみで、accessible **name** を移管しない（D-2 / AC-A6）。
- → navigation drift **なし**（既存 `SidebarNavItem.spec` / `SidebarShell.spec` の nav 系 assert は無改修で green を維持する設計）。

## 8.4 完了条件

- tooltip CSS が `globals.css` に `.ubm-shell-tooltip(-wrap)` の **1 定義のみ**で存在し、コントロール側に同等スタイルの複製がない（grep で `position: absolute` 系の tooltip 重複なし）。
- wrap ロジックが `SidebarTooltip.tsx` 1 source に集約され、nav item / AdminPublicReturn / collapse toggle が同 component を import する（user menu は CSS class のみ流用の inline bubble）。
- HEX / `bg-[#xxx]` / `text-[#xxx]` が新規 CSS / class に残らない（`verify:tokens` green・AC-A4）。
- navigation drift なし（nav 数・順序・accessible name 不変）。
- `apps/api` 差分 0。
