---
spec_classification: implementation_spec
state: spec_created
phase: 3
phase_name: 設計レビュー
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 3: 設計レビュー

## 3.1 不変条件レビュー

| 不変条件 | 確認観点 | 結果 |
|---------|---------|------|
| I-E1（Task A 契約破壊なし） | `useSidebarState` 戻り値 shape を変えず挙動追加のみ。`SidebarShell` は既存 `mobileTriggerSlot` prop を消費 | OK（追加のみ・後方互換） |
| I-E2（state owner 1 系） | trigger / drawer は自前 state を持たず context 経由 | OK（`useSidebarShellContext` のみ） |
| I-E3（API/D1 不変） | UI 層のみ。fetch / route handler に触れない | OK |
| I-E4（token only） | backdrop / 幅 / 背景を token 経由、fallback も oklch | OK（HEX 不使用を Phase 9 grep で確認） |
| I-E5（CSS breakpoint 正本） | 表示切替は `md:` class。matchMedia は初期 collapsed の 1 回のみ | OK（resize listener なし） |
| I-E6（focus trap 単一 source） | trap は `useFocusTrap` hook へ委譲し SidebarDrawer に再実装ゼロ。`Drawer.tsx` も同 hook へ内部 refactor（公開 API 不変）。body 属性 / backdrop / md:hidden は hook 外の固有 chrome | OK |

## 3.2 後方互換性

- Task A の `SidebarShell` / `useSidebarState` を利用する他 sibling（Task C / D の layout 配線）は、`mobileTriggerSlot` を既に渡す前提。Task E は slot 内に `SidebarMobileTrigger` を置くだけで、layout 側の呼び出しシグネチャを変えない。
- `useSidebarState` の戻り値型 `{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }` は不変。`mode` の初期値ロジックを「localStorage > viewport 既定 > expanded fallback」に精緻化するが、localStorage 既存値がある既存ユーザの挙動は変わらない。

## 3.3 既知リスク

| ID | リスク | 対策 |
|----|--------|------|
| R-E1 | 初期 collapsed 判定の `matchMedia` を effect で行うと、初回 render（expanded）→ effect 後（collapsed）で md viewport に一瞬の flash が出る | md では CSS で sidebar 自体は常時表示。collapsed/expanded は幅の差のみで mount/unmount は起きないため flash は幅トランジションに留まる。気になる場合は `transition` を token で抑制（Phase 8 任意） |
| R-E2 | drawer の `children` に渡す nav ツリーが `<aside>` と二重 render され、id 重複や aria-current の二重発火が起きる | drawer は `< md` でのみ mount、`<aside>` は `hidden md:flex`。DOM 上は両方存在しうる（sm でも `<aside>` は hidden だが DOM には残る）。`<aside>` 側 nav に重複しうる固定 id を置かない。aria-current は href ベースで両方に付くが視覚上は片方のみ可視。Phase 6 で id 重複 0 を assert |
| R-E3 | `usePathname` を `useSidebarState` 内で呼ぶと、hook を使う全 component が pathname 変化で再 render する | `useSidebarState` は shell 1 箇所でのみ使う前提（context provider 直下）。再 render 範囲は shell に閉じる |
| R-E4 | scroll lock を JS で `body.style.overflow` 操作すると SSR / hydration mismatch / 復帰漏れが起きる | 属性 `data-shell-drawer-open` + CSS で実現し、cleanup で属性除去（Drawer.tsx パターン同様 SSR 安全） |
| R-E5 | backdrop click と panel 内 click の判別 | backdrop と panel を兄弟要素にし、onClick は backdrop のみ。panel click は backdrop に伝播しない（stopPropagation 不要な構造） |
| R-E6 | Task A 未実装状態で Phase 5 に着手すると import 解決不能 | P50-2 を Phase 5 着手 gate とし、`apps/web/src/components/shell/{useSidebarState,SidebarShellContext,SidebarShell}.ts(x)` の存在を確認してから着手 |
| R-E7 | `Drawer.tsx` を `useFocusTrap` 経由に内部 refactor する際、既存 consumer（`MemberDrawer` / `BulkRepublishDrawer`）や `primitives.component.spec.tsx` を壊す | 公開 props `{ open, onClose, title, children }` と DOM 出力（`role="dialog"` / `aria-modal` / `aria-labelledby="drawer-title"` / `<h2>`）を不変に保つ。refactor は trap ロジックを hook 呼び出しへ置換するのみ。Phase 9 で `primitives.component.spec` green を回帰確認 |
| R-E8 | hook 抽出により Drawer と SidebarDrawer の focusable selector が乖離する | `useFocusTrap` 内に selector を 1 つ定義し両者が共有。selector の二重定義を作らない（複製ゼロの担保） |

## 3.4 進行判定

→ 全不変条件 OK・リスクに対策あり。Phase 4（テスト計画）へ進む。
