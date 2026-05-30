---
spec_classification: implementation_spec
state: spec_created
phase: 12
phase_name: ドキュメント同期
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 12: ドキュメント同期

中学生レベル概念説明セクションを含む canonical 9 headings に従う。

## 12.1 ゴール

中学生レベルで説明: スマホ(狭い画面)では、左に並ぶメニュー(sidebar)を普段は隠しておき、左上のボタン(hamburger)を押すと横からスーッと出てくる「引き出し(drawer)」で見せる。タブレットでは細い状態で最初から出しておく。PC では普通に広げて出す。

このように「画面の幅で見せ方を変える」のは、ほとんど CSS の `md:` という印(768px 以上のときだけ効くスタイル)で切り替える。新しい状態(state)をたくさん作るのではなく、すでにある `useSidebarState` という 1 つの仕組みから状態を読むだけにして、部品が勝手にバラバラの状態を持たないようにする。

## 12.2 アーキテクチャ整合

- `SidebarMobileTrigger`(hamburger)と `SidebarDrawer`(引き出し)は **state を持たず**、`useSidebarState()` 1 系から `{mode, drawerOpen, setDrawerOpen}` を読む(I-E2)。
- focus trap は新規実装せず、`useFocusTrap` hook(`apps/web/src/lib/a11y/useFocusTrap.ts`・`Drawer.tsx` から抽出した単一 source)を `Drawer.tsx` と `SidebarDrawer.tsx` で共有する。SidebarDrawer に trap を再実装しない(I-E6)。
- scroll lock は `body[data-shell-drawer-open="true"]` 属性 + CSS で実現する。属性付与は drawer open 時のみ、SSR 安全に(初期 render では付かない)行う(AC-E5)。
- breakpoint は CSS が正本(`hidden md:flex` / `md:hidden` / `lg` 相当)。matchMedia は初期 collapsed/expanded 判定の 1 回限りに閉じる(AC-E10, I-E5)。
- `SidebarShell` の `<aside>` を `hidden md:flex` 化し、`mobileTriggerSlot` に `SidebarMobileTrigger` を差し込む。Task A の `SidebarShell` API / `SidebarShellContext` 契約は破壊しない(I-E1)。

## 12.3 不変条件への反映

- I-E1: Task A の `SidebarShell` / `useSidebarState` / `SidebarShellContext` 契約を破壊しない。
- I-E2: state owner は `useSidebarState` 1 系のみ。drawer / trigger は読み取り専用。
- I-E3: API / D1 / auth は一切変更しない。
- I-E4: shell token を使用し、HEX 直書き / `bg-[#xxx]` 禁止(`verify-design-tokens` gate 対象)。
- I-E5: breakpoint は CSS 正本。matchMedia は初期判定のみ。
- I-E6: focus trap は `useFocusTrap` hook 単一 source とし、`Drawer.tsx`（内部 refactor）と `SidebarDrawer.tsx` が共有。SidebarDrawer に trap を再実装しない。

## 12.4 関連 task との接続

- **Task A** (SidebarShell primitive): 基盤契約(`useSidebarState` / `SidebarShellContext` / `mobileTriggerSlot` / `Drawer.tsx` focus-trap / shell token / `browserDocument()`)。本タスクの前提。
- **Task B** (UserMenu): drawer 内に表示される UserMenu。drawer は children をそのまま描画する slot として B の出力を受け入れる。
- **Task C / D** (public・member layout / admin layout 移行): `SidebarShell` を実際に mount する layout 層。本タスクの responsive 挙動はこれらの layout 上で観測される。
- **Task F** (visual baseline smoke): responsive 3 viewport の Playwright snapshot 自動化。本タスクの手動 screenshot を自動 baseline 化する委譲先。

## 12.5 公式ドキュメント更新

- 親 workflow `docs/30-workflows/unified-sidebar-shell-public-and-admin/outputs/phase-12/implementation-guide.md` に **Task E セクション**を追記:
  - responsive マトリクス(`<768px` / `768-1023px` / `>=1024px` × aside 表示 / drawer / hamburger / 初期 collapsed・expanded)
  - `SidebarDrawer` API(`open` / `onClose` / `children` と focus trap・scroll lock 方式)
  - `SidebarMobileTrigger` の役割(`setDrawerOpen(true)` のみ・`md:hidden`)
- `apps/web/src/components/shell/SidebarDrawer.tsx` の JSDoc に `open` / `onClose` / `children` prop と「focus trap は `useFocusTrap` hook へ委譲（単一 source）・open 時のみ初期 focus」「scroll lock は body 属性 + CSS」契約を記す。
- `apps/web/src/lib/a11y/useFocusTrap.ts` の JSDoc に「dialog の初期 focus / Tab ループ / Esc→onClose / previousFocus 復帰の単一 source・`Drawer.tsx` と `SidebarDrawer.tsx` が共有・SSR no-op」を記す。

## 12.6 lessons-learned 反映候補

- **L-MOBDRAWER-001**: focus trap が 2 component 以上で必要になったら、wrap ではなく **hook 抽出（`useFocusTrap`）で単一 source 化**する
  - **Why**: focus trap を画面ごとに作る/コピーすると挙動が分岐し accessibility 回帰の温床になる。一方、既存 dialog primitive（`Drawer.tsx`）は title 必須・backdrop/className 不在で、要件の異なる新 drawer を素直に wrap できないことがある
  - **How to apply**: trap ロジック（初期 focus / Tab ループ / Esc / previousFocus）だけを hook 抽出し、primitive を内部 refactor して同 hook を呼ばせる（公開 API 不変＝既存 consumer 無改修）。新 component は hook + 固有 chrome（backdrop / scroll-lock / wrapper）で構成する。「hook 抽出＝過剰設計」の即断は、trap が単一 component 限定のときのみ妥当
- **L-MOBDRAWER-002**: scroll lock は `body[data-shell-drawer-open]` 属性 + CSS で SSR 安全に行う
  - **Why**: render 中に直接 `document.body.style` を触ると SSR / hydration mismatch を起こす
  - **How to apply**: open 時のみ effect で body 属性を付与し、CSS 側で `overflow: hidden` を当てる。初期 render では属性を付けない
- **L-MOBDRAWER-003**: breakpoint は CSS 正本・matchMedia は初期判定 1 回に閉じる
  - **Why**: matchMedia listener を resize で常時 evaluate すると state owner が二重化し I-E2 / I-E5 に反する
  - **How to apply**: 表示切替は `hidden md:flex` / `md:hidden` の CSS で行い、JS の matchMedia は初期 collapsed/expanded 判定のみ(localStorage 優先)に使う

上記は `aiworkflow-requirements` / `task-specification-creator` skill の lessons へ Phase 13 直前に反映する。

## 12.7 evidence

- spec compliance check: `docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/outputs/phase-12/phase12-task-spec-compliance-check.md` (実装時に生成)

## 12.8 未タスク検出 (unassigned-task)

本 spec 作成段階では unassigned-task = 0。将来候補と、本サイクル外とする根拠:

- **swipe-to-close ジェスチャ**: touch gesture の独立スコープ(本タスクは Esc / backdrop / link click の close 経路に限定)。今回サイクル外。
- **prefers-reduced-motion 対応**: drawer のスライドアニメーション抑制は motion 設計の独立スコープ。今回サイクル外。

いずれも分量を理由とした先送りではなく(CONST_007)、責務スコープが本タスク(responsive 表示 + drawer open/close 契約)と独立しているための区分。実装中に I-E1..E6 に抵触する想定外の作業が発生した場合のみ unassigned-task として切り出す。

## 12.9 完了条件

- 親 workflow `implementation-guide.md` に Task E セクション(responsive マトリクス / SidebarDrawer API / scroll lock 方式)追記済
- `SidebarDrawer.tsx` の JSDoc に open / onClose / children + focus trap + scroll lock 契約を記載済
- lessons-learned L-MOBDRAWER-001 / 002 / 003 を `aiworkflow-requirements` / `task-specification-creator` skill の lessons へ反映済 (Phase 13 直前)
- Phase 12 strict 7 outputs を `outputs/phase-12/` に作成済
- `outputs/artifacts.json` と root `artifacts.json` の parity 作成済
- aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory 同期済
