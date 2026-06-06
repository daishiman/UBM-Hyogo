---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 2
phase_name: 設計
created_at: 2026-06-03
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 2: 設計

## 2.0 設計サマリ（3 レーン）

| レーン | 中核設計 | 状態所有 | 検証層 |
|--------|----------|----------|--------|
| A: ツールチップ | 新規 `SidebarTooltip`（CSS 駆動・`role="tooltip"` + `aria-describedby`）で collapsed の icon-only コントロールを包む | なし（CSS `:hover`/`:focus-within`） | RTL unit（DOM 契約）+ Phase 11 visual |
| B: フッター固定 | `[data-component="public-footer"]` を `position: sticky; bottom: 0` + 不透明背景 | なし（純 CSS） | Phase 11 Playwright visual + 手動 |
| C: ヘッダー固定 | mobile-bar に inline Tailwind `sticky top-0 z-30` | なし（純 class） | RTL class assert + Phase 11 手動 |

> 3 レーンとも新規 JS state を持たない（I-4）。A はライブラリ非依存の CSS ツールチップ、B/C は CSS/class のみ。

---

## 2.1 レーン A — `SidebarTooltip.tsx`（新規 Client）

### 2.1.1 役割と契約

collapsed 時の icon-only コントロールを包み、ホバー / フォーカスでラベルバブルを表示する shell 固有 wrapper。`collapsed === false` のときはラップせず children をそのまま返す（expanded はラベル可視のため不要・AC-A2）。

```tsx
"use client";
import { useId } from "react";
import type { ReactElement } from "react";

export interface SidebarTooltipProps {
  /** ツールチップに表示するラベル（= コントロールのアクセシブル名と同義）。 */
  readonly label: string;
  /** collapsed=false ならラップせず children を直返し（AC-A2）。 */
  readonly collapsed: boolean;
  /**
   * 単一の trigger 要素。`aria-describedby` を注入するため cloneElement する。
   * 既存の aria-describedby があれば連結する。
   */
  readonly children: ReactElement;
}

export function SidebarTooltip(props: SidebarTooltipProps): ReactElement;
```

### 2.1.2 レンダリング契約

- `collapsed === false` → `return children`（パススルー。DOM 追加なし）。
- `collapsed === true` → 次の構造を返す:

```tsx
const tooltipId = useId();
const described = cloneElement(children, {
  "aria-describedby": [children.props["aria-describedby"], tooltipId].filter(Boolean).join(" "),
});
return (
  <span data-shell-block="tooltip-wrap" className="ubm-shell-tooltip-wrap">
    {described}
    <span role="tooltip" id={tooltipId} data-shell-block="tooltip" className="ubm-shell-tooltip">
      {label}
    </span>
  </span>
);
```

- **a11y 方針（AC-A6 / I-8）**: trigger 側のアクセシブル名（nav item の sr-only ラベル、collapse toggle / user menu の `aria-label`）は**維持**する。ツールチップは `role="tooltip"` + `aria-describedby` で **description** として関連付けるのみ。name と description が同一文言でも二重読み上げにはならない（多くの SR は name のみ即読み上げ、description は補助）。trigger 自体の name を tooltip へ移管しない。
- バブルは視覚専用ではなく `role="tooltip"` を持つ（AC-A1 / AC-A3）。`aria-hidden` は付けない（aria-describedby 参照先のため）。
- `cloneElement` で `aria-describedby` を注入するため、`children` は単一の React 要素であること（`<Link>` / `<a>` / `<button>` / `<summary>` いずれか単体）。

### 2.1.3 CSS（`globals.css` の shell セクションへ追加・I-2 / AC-A4）

`[data-shell="sidebar"]`（globals.css:1417 付近）と同じ shell 系セクション / 同 layer に追加する。色・影・角丸はすべて token 経由（HEX 厳禁）。

```css
.ubm-shell-tooltip-wrap {
  position: relative;
  display: inline-flex; /* nav item は <li> 直下の <a> を包むため block 幅を維持する場合は display: block も可（実装時に layout 影響を確認） */
}

.ubm-shell-tooltip {
  position: absolute;
  left: calc(100% + var(--ubm-space-2)); /* collapsed sidebar の右側へ吹き出す */
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;                            /* drawer(z-40) より下・本文より上 */
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  padding: var(--ubm-space-1) var(--ubm-space-2);
  border-radius: var(--ubm-radius-sm);
  border: 1px solid var(--ubm-color-border-default);
  background: var(--ubm-color-surface-panel);
  color: var(--ubm-color-text-primary);
  box-shadow: var(--ubm-shadow-md);
  font-size: var(--ubm-text-xs, 12px);
  transition: opacity var(--ubm-dur-fast) ease, visibility var(--ubm-dur-fast) ease;
}

.ubm-shell-tooltip-wrap:hover .ubm-shell-tooltip,
.ubm-shell-tooltip-wrap:focus-within .ubm-shell-tooltip {
  opacity: 1;
  visibility: visible;
}
```

> 実装メモ: token 名（`--ubm-space-1/2`, `--ubm-radius-sm`, `--ubm-color-surface-panel`, `--ubm-shadow-md`, `--ubm-dur-fast`）は `tokens.css` に実在することを Phase 5 着手時に grep 確認する（`--ubm-text-xs` が無ければ `12px` fallback または既存 font-size token を使用）。`z-index: 30` は数値であり color token 規約の対象外（`verify-design-tokens` は色のみ検査）。

### 2.1.4 各コントロールへの適用

| コントロール | ファイル | ラップ対象 | label |
|------------|---------|-----------|-------|
| nav item | `SidebarNavItem.tsx` | collapsed 時の `<Link>` / `<a>`（`<li>` の中身） | `item.label` |
| 公開に戻る | `SidebarShell.tsx` `AdminPublicReturn` | collapsed 時の `<Link>`（`title` 属性は削除） | "公開サイトに戻る" |
| ユーザーメニュー | `SidebarUserMenu.tsx` | collapsed 時の `<summary>` | "ユーザーメニュー"（viewer 時は "ログイン" を含意するが name は既存 aria-label="ユーザーメニュー" を維持） |
| collapse toggle | `SidebarCollapseToggle.tsx` | collapsed 時の `<button>` | "サイドバーを展開"（= 既存 aria-label と同義） |

> `SidebarNavItem.tsx`: 既存の `if (item.external) { return <li><a>... }` と通常 `<li><Link>...` の 2 分岐それぞれで、collapsed 時のみ `<a>`/`<Link>` を `SidebarTooltip` で包む。`<li>` 直下に wrap が入るため、`.ubm-shell-tooltip-wrap` の `display` は `block`（リンクの clickable 幅維持）を実装時に確認する。
>
> `SidebarUserMenu.tsx`: `<summary>` を `cloneElement` 対象にするため、collapsed 分岐で `<SidebarTooltip label="ユーザーメニュー" collapsed={collapsed}>{<summary .../>}</SidebarTooltip>` とする。`<details>` の直下子は `<summary>` である必要があるため、tooltip wrap が `<summary>` を `<span>` で包むと semantics が崩れる懸念がある → **実装方針**: user menu は `<summary>` を包まず、`<summary>` 内に tooltip バブルを直接配置する（`SidebarTooltip` を使わず、collapsed 時に `<summary>` 内へ `<span role="tooltip">` を足す inline 実装）か、`SidebarTooltip` に「wrap せず sibling bubble を返す」mode を持たせる。Phase 3 で判断 → **採用**: `SidebarTooltip` の wrap は `<details>/<summary>` には不適のため、user menu は `<summary>` を `relative` にして内部へ `role="tooltip"` バブルを直接追加する（同 CSS class 流用）。`SidebarNavItem` / `AdminPublicReturn` / `CollapseToggle` は `SidebarTooltip` wrap を使う。

### 2.1.5 DOM 契約サマリ（レーン A）

| 要素 | 属性 / class | 根拠 AC |
|------|-------------|---------|
| tooltip wrap | `data-shell-block="tooltip-wrap"`、`.ubm-shell-tooltip-wrap`（collapsed のみ） | AC-A1 |
| tooltip bubble | `role="tooltip"`、一意 `id`、`.ubm-shell-tooltip`、textContent=label | AC-A1 / AC-A3 |
| trigger | `aria-describedby` に tooltip `id` を含む | AC-A3 |
| expanded | wrap / bubble 不在（children 直返し） | AC-A2 |

---

## 2.2 レーン B — 公開フッター sticky bottom（`legacy-public.css`）

### 2.2.1 変更内容

`legacy-public.css:716` の `[data-component="public-footer"]` ブロックへ次を追加する:

```css
[data-component="public-footer"] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px 28px;
  margin-top: auto;                              /* 既存（C4） */
  /* --- 追加（Lane B） --- */
  position: sticky;
  bottom: 0;
  z-index: 20;                                   /* drawer(40)・mobile-bar(30) より下、本文より上 */
  background: var(--ubm-color-surface-bg);       /* 不透明にしてコンテンツがフッター下を透けさせない（AC-B2） */
  /* --- 既存継続 --- */
  border-top: 1px solid var(--ubm-color-border-default);
  color: var(--ubm-color-text-secondary);
  font-size: 12px;
}
```

### 2.2.2 sticky bottom が常時表示になる理屈（設計根拠）

- フッターの containing block は `main`（`flex min-w-0 flex-1 flex-col`、`SidebarShell.tsx:129`）。公開コンテンツが viewport より高いとき `main` の box は文書全高まで伸びる。
- `position: sticky; bottom: 0` は「要素の自然位置が viewport 下端より下にある間、viewport 下端へピン留め」する挙動。フッターが最後の子でも、containing block（`main`）が viewport より高い限り、スクロール中はフッターが viewport 下端に固定表示され、最下部到達時に自然配置へ戻る（= 常時表示・AC-B1）。
- 不透明背景（`surface-bg`）+ `z-index` により、フッター下をコンテンツがスクロールしても透けない（AC-B2）。

### 2.2.3 注意（実装時 verify）

- 既存の mobile media block（`legacy-public.css:1197`）にも `[data-component="public-footer"]` がある。sticky / bottom / background は base ブロック（716）に置けば mobile にも継承される（mobile block は padding/gap の上書きのみ）。mobile block 側で `position` を上書きしていないことを確認する。
- `main` やその祖先に `overflow: hidden` / `overflow: clip` が無いことを確認する（sticky は最近接スクロール祖先基準。`overflow:hidden` 祖先があると sticky 範囲がそこに限定される）。`SidebarShell.tsx` の `<aside>` は collapsed tooltip を外側へ出す必要があるため `overflow-visible` とする。`main` / `div.flex-1.flex-col` / `shell-root` に overflow 制限が無いことを Phase 5 で grep 確認する。
- `SidebarNav` は expanded では従来どおり `overflow-y-auto`、collapsed では tooltip を横へ出すため `overflow-visible` に切り替える。
- 色は token のみ（`verify-design-tokens` の HEX 検査対象・AC-B3）。

---

## 2.3 レーン C — モバイルヘッダー sticky（`SidebarShell.tsx`）

### 2.3.1 変更内容

`SidebarShell.tsx:120-123` の mobile-bar `<div>` の className に `sticky top-0 z-30` を追加する:

```tsx
<div
  data-shell="mobile-bar"
  className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] px-3 py-2 md:hidden"
>
```

- `sticky top-0`：mobile-bar を viewport 上端へピン留め（スクロール中も常時表示・AC-C1）。スクロール祖先は body（`< md` で `<aside>` は hidden、mobile-bar は `div.flex-1.flex-col` 内）。
- `z-30`：drawer（`SidebarDrawer` の `z-40`）より下、本文より上（AC-C2）。tooltip / footer の z-index 階層（tooltip 30 / footer 20 / drawer 40）と整合。
- `md:hidden` は不変（AC-C3：md 以上では従来通り非表示）。
- 背景 `bg-[var(--shell-bar-bg)]` は既存のまま不透明（コンテンツが下を透けない）。

### 2.3.2 z-index 階層（全レーン整合）

| 要素 | z-index | 根拠 |
|------|---------|------|
| `SidebarDrawer`（モバイル overlay） | 40（既存 Tailwind `z-40`） | 最前面 |
| `SidebarShell` mobile-bar | 30（新規 `z-30`） | drawer の下・本文の上（AC-C2） |
| `SidebarTooltip` バブル | 30（CSS `z-index: 30`） | collapsed sidebar 上で本文より前面。drawer 表示時は `< md` で tooltip 非対象（sidebar hidden）のため衝突しない |
| 公開フッター | 20（新規 `z-index: 20`） | 本文の上・mobile-bar/drawer の下 |
| user-menu popover | 20（既存 `z-20`） | footer と同階層（同時表示しない） |

---

## 2.4 タスク非接触（I-1 / I-3 / I-4）

- `apps/api` / D1 / Google Form schema / auth：差分 0。
- `apps/web/src/components/ui/`：汎用 primitive 追加なし（`SidebarTooltip` は shell 配下）。
- `useSidebarState` / `SidebarShellContext` / drawer / collapse cookie：シグネチャ・挙動とも不変（A/B/C は描画と CSS のみ）。
- `tokens.css`：新規 token 追加なし（既存 token 流用。ツールチップは surface-panel/border/shadow/space/radius、フッターは surface-bg を使用）。
