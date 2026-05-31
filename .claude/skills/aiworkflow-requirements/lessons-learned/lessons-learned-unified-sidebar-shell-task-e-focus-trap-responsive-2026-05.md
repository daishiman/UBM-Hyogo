# Lessons Learned: unified-sidebar-shell Task A+E / focus-trap 単一化・属性 scroll lock・responsive 契約 (2026-05)

> 関連: [[workflow-unified-sidebar-shell-public-and-admin-artifact-inventory]] /
> [[changelog/20260528-unified-sidebar-shell-public-and-admin]]
>
> 対象 wave: `docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/`（Phase 1-13）と
> 前提 Task A の `apps/web/src/components/shell/**`、`apps/web/src/lib/a11y/useFocusTrap.ts`、
> `apps/web/src/components/ui/Drawer.tsx` refactor、`apps/web/src/styles/{tokens,globals}.css` への
> Phase-12 retrospective sync。

## サマリ

mobile overlay drawer を既存 collapsible sidebar に足す際の a11y / SSR / responsive 設計を Phase-12 で体系化した。
focus trap を画面ごとに再実装する誘惑を `useFocusTrap` 単一 source で断ち、scroll lock は属性 + CSS で hydration mismatch を避け、
breakpoint 表示は CSS を正本とし JS `matchMedia` を初期判定 1 回に閉じた。あわせて、実装完了済の成果物に対し
spec_only 前提の compliance-check / evidence 記述が残ると doc↔code 矛盾になる回帰を Phase-12 レビューで検出・是正した。

---

## L-USSTE-001: dialog focus trap は `lib/a11y/useFocusTrap.ts` の単一 source に集約する

**症状**: Drawer 系画面が増えると、各 component が初期 focus / Tab 境界ループ / Esc→onClose / previousFocus 復帰を
個別実装し、a11y 回帰（trap 抜け・focus 復帰漏れ）の温床になる。Task E spec でも Phase 5（逐語コピー）/ Phase 8・10（`Drawer.tsx` wrap 必須）/
Phase 8.2（Drawer API 不変）が同時成立不能な三すくみになっていた。

**対応**: `Drawer.tsx` の確立済 inline trap を `useFocusTrap(open, onClose, ref)` へ抽出し、`Drawer.tsx`（内部 refactor のみ・
公開 props と DOM 出力は不変）と `SidebarDrawer.tsx` の双方が同一 hook を呼ぶ。trap は dialog 共通の抽象、
backdrop click / scroll lock / `md:hidden` / token 幅は画面固有 chrome として hook の外側に置く（関心の分離）。

**How to apply**: 新しい modal/drawer を足すときは trap を書かず `useFocusTrap` を呼ぶ。trap ロジックを触る必要が出たら
hook 1 箇所のみ変更し、消費側の回帰 spec（`primitives.component.spec` 等）が無改修で green を維持することを確認する。

## L-USSTE-002: scroll lock は `body[data-*]` 属性 + CSS で行い、`body.style` 直書きを避ける

**症状**: `document.body.style.overflow = "hidden"` を JS で直書きすると SSR/CSR で初期 style が食い違い hydration mismatch を招く。

**対応**: `SidebarDrawer` が `open` 時に `body[data-shell-drawer-open="true"]` 属性を付与し、`globals.css` の
`body[data-shell-drawer-open="true"] { overflow: hidden }` で lock。cleanup で属性を除去する（open=false 遷移・unmount 両方で発火）。
style を JS で触らないため hydration safe。

**How to apply**: body/html へ振る舞い系の lock を足すときは「JS は data 属性、見た目は CSS」の 1 系統に統一する。

## L-USSTE-003: breakpoint 表示は CSS（Tailwind `md:`）正本・`matchMedia` は初期判定 1 回に閉じる

**症状**: viewport 連動の表示切替を `matchMedia` + resize listener で JS 駆動すると、CSS と二重管理になり ちらつき・listener leak の温床。

**対応**: `<aside class="hidden md:flex">` / drawer・trigger `md:hidden` を表示切替の正本にする。`useSidebarState` の
`matchMedia('(min-width:1024px)')` 参照は初回 effect の 1 回限り（依存空配列・resize 非追従）で「初期 collapsed 判定」のみに使い、
SSR では `browserDocument()?.defaultView` が無く no-op（expanded fallback）。localStorage に明示値があればそちらを優先。

**How to apply**: responsive 表示は CSS 第一。JS の viewport 判定は「初期状態を 1 度決める」用途に限定し、継続 watch を足さない。

## L-USSTE-004: aside と drawer は同一 `sidebarTree` 変数を共有しつつ固定 id を置かない

**症状**: sidebar 本体（brand + nav + footer）を `<aside>` と overlay drawer の両方に出すと、固定 `id` を持つ要素が
DOM に二重化し aria 参照が壊れる。

**対応**: `SidebarShell` で nav ツリーを `const sidebarTree = (...)` に一度だけ定義し `<aside>` と `<SidebarDrawer>` の両方へ渡す
（重複 component 定義の回避）。ツリー内に固定 id を置かず、排他は CSS（`md:hidden` / `hidden md:flex`）と drawer の `open=false→null`
unmount で担保（同時に visible にならない）。R-E2 として spec 化し `SidebarShell.spec` で「固定 id 不在」を assert。

**How to apply**: 同一 UI を 2 箇所に mount する設計では id/aria-controls 等のグローバル一意属性を要素に焼かず、props/data 属性で表現する。

## L-USSTE-005: 実装完了後は spec_only 前提の compliance-check / evidence 記述を実態へ逆流同期する

**症状**: spec 作成時に「Task A 未実装 / 実装 pending / Phase 11 n/a」と書いた compliance-check / implementation-guide が、
同一サイクルで実装を完了した後も更新されず、doc↔code が矛盾（focused vitest 数値 44 vs 実測 41/67、Phase 11 evidence n/a vs present、
implementation-guide「aggregated-at-parent」claim vs 子 root に実体あり)。

**対応**: 実装が landed したら Phase-12 成果物の verdict / workflow_state 解釈 / evidence status / strict-7 集約先 / 数値を
実態へ更新する。`state: spec_created`（親整合の spec ライフサイクル）と「実装ライフサイクル完了」を明示的に区別して記す。
親 root が「aggregated-at-parent」を主張する成果物は、親に実体（Task E 要約セクション等）を実際に置いて claim を真にする。

**How to apply**: 「spec 完了」と「実装完了」を別ライフサイクルとして doc 上で区別し、実装 landed 時に evidence 表・数値・集約先を
逆流同期する Phase-12 チェックを必ず通す。pending は構造的依存（sibling task mount）と user-gated（PR）だけに限定して列挙する。

## L-USSTE-006: 未定義 `--ubm-*` 色トークンの参照は fallback 付きで書く（gate 違反を避けつつ affordance 担保）

**症状**: `hover:bg-[var(--ubm-color-surface-hover)]` のように SSOT（09b）未定義の `--ubm-*` トークンを fallback なしで参照すると、
hover 背景が描画されない（invalid CSS → 無視）。既存 `AdminSidebarNavItem.tsx` も同トークンを未定義参照しており、慣習的に伝播していた。
一方、tokens.css に `--ubm-color-surface-hover` を定義すると `verify-design-tokens` の `missing-in-09b` で gate fail する（`--ubm-` prefix かつ 09b 未掲載のため）。

**対応**: 定義を増やさず参照側に fallback を置く: `var(--ubm-color-surface-hover,var(--ubm-color-surface-bg-2))`。
これで gate（reference 側は未検査）を不変に保ちつつ hover affordance を回復。`verify:tokens` の color-literal scan は var-to-var に HEX が無いため不発。
SSOT への正式追加（tokens.css 3 テーマ + 09b §9 JSON）は設計トークン governance の独立タスクとして切り出す。

**How to apply**: 未定義の `--ubm-*` 色を参照するときは必ず `var(--target, var(--defined-fallback))` 形式にする。
SSOT 追加が必要なら 09b と tokens.css を同 wave で更新し `verify:tokens` を通す（reference の fallback とは別判断）。
