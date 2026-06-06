---
phase: 12
phase_name: ドキュメント同期 / implementation-guide
task: shell-sidebar-tooltip-footer-header-responsive
状態: implemented_local_evidence_captured
作成日: 2026-06-03
parent_workflow: null
---

# shell サイドバー collapsed ツールチップ + フッター sticky + モバイルヘッダー sticky 実装ガイド

> 本ガイドは実装済みの current contract を記録する。local semantic evidence は focused shell Vitest 5 files / 33 tests PASS、staging visual screenshot は user gate で取得する。

---

## Part 1 — 中学生レベルの説明（なぜ必要か → 何をするか）

### A. 畳んだ引き出しのラベル（ツールチップ）

たとえば、机の引き出しを細く畳むと、中身が見えず、絵（アイコン）だけが残る。「これは何の引き出しだっけ？」と分からなくなる。

**なぜ必要か**: サイドバーを細く畳むと、メニューの文字が消えてアイコンだけになり、「会員ディレクトリ」なのか「マイページ」なのか分からなくなるから。

**何をするか**: アイコンにマウスを乗せた（またはキーボードで選んだ）ときだけ、その引き出しの**名札（ラベル）**を横にぴょこっと出す。これが「ツールチップ」。畳んでいないとき（広げているとき）は、もう文字が見えているので名札は出さない。

### B. いつも見えるページの足跡（フッター）

長い本を読んでいるとき、目次や著作権の表示が一番最後のページにしかないと、途中では見えない。

**なぜ必要か**: 公開サイトの一番下にある足跡（プライバシーポリシー・利用規約・著作権）は、ページを下までスクロールしないと見えなかったから。

**何をするか**: その足跡を画面の**一番下に貼りつけて**、どこを見ていてもいつも見えるようにする。下が透けないように、足跡の後ろには色（背景）をちゃんと塗る。

### C. スマホで上に貼りつくタイトル帯（ヘッダー）

スマートフォンで長いページを下にスクロールすると、上にあったタイトル帯が一緒に上へ流れて消えてしまう。

**なぜ必要か**: 「今どのページにいるか」を示すタイトル帯が消えると、迷子になるから。

**何をするか**: スマホ表示のときだけ、そのタイトル帯を画面の**一番上に貼りつけて**、スクロールしてもいつも上にいるようにする。

> 3 つとも、新しい複雑な仕掛けはほとんど作らない。ほぼ「貼りつける」という CSS（`position: sticky`）と、すでにある「畳んでいるか？」の合図（`collapsed`）だけで実現する。

### 今回作ったもの

- **名札（ツールチップ）を出す小さな部品**（`SidebarTooltip`）を 1 つ新しく作る。畳んだサイドバーのアイコンに乗せると、横に名前がぴょこっと出る。
- **公開ページの足跡（フッター）**を画面の一番下にいつも貼りつける（CSS の `position: sticky` を足すだけ）。
- **スマホのタイトル帯（ヘッダー）**を画面の一番上にいつも貼りつける（class を足すだけ）。

新しく作るファイルは「名札の部品」1 つだけで、あとは既にあるものに少し足すだけ。

---

## Part 2 — 技術者レベルの説明

### A. `SidebarTooltip`（新規 Client component）

#### 型定義（`SidebarTooltipProps`）

```tsx
"use client";
import { useId, cloneElement } from "react";
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

#### レンダリング契約

- `collapsed === false` → `return children`（パススルー。DOM 追加なし・AC-A2）。
- `collapsed === true` → wrap して `role="tooltip"` バブルを sibling に描画:

```tsx
const tooltipId = useId();
const described = cloneElement(children, {
  "aria-describedby": [children.props["aria-describedby"], tooltipId]
    .filter(Boolean)
    .join(" "),
});
return (
  <span data-shell-block="tooltip-wrap" className="ubm-shell-tooltip-wrap">
    {described}
    <span
      role="tooltip"
      id={tooltipId}
      data-shell-block="tooltip"
      className="ubm-shell-tooltip"
    >
      {label}
    </span>
  </span>
);
```

#### `role="tooltip"` + `aria-describedby` パターン（AC-A3 / AC-A6 / I-8）

- trigger 側のアクセシブル名（nav item の sr-only ラベル、collapse toggle / user menu の `aria-label`）は**維持**する。
- ツールチップは `role="tooltip"` + `aria-describedby` で **description** として関連付けるのみ。name を tooltip へ移管しない。
- name と description が同一文言でも、多くのスクリーンリーダは name を即読み上げ・description を補助扱いするため二重読み上げにならない。
- バブルに `aria-hidden` は付けない（`aria-describedby` 参照先のため）。
- `children` は単一 React 要素（`<Link>` / `<a>` / `<button>`）であること（`cloneElement` 制約）。

#### `<details>/<summary>` 例外（D-3）

user menu の `<summary>` は `<details>` 直下子でなければならないため `<span>` wrap が不適。`SidebarUserMenu.tsx` は `<summary>` を `relative` にして内部へ `role="tooltip"` バブルを直接配置する（同 `.ubm-shell-tooltip` class 流用）。`SidebarNavItem` / `AdminPublicReturn` / `SidebarCollapseToggle` は `SidebarTooltip` wrap を使う。

#### CSS（`globals.css` の shell セクション・I-2 / AC-A4）

色・影・角丸はすべて token 経由（HEX 厳禁）。token 存在は確認済（`--ubm-color-surface-panel` / `--ubm-color-border-default` / `--ubm-color-text-primary` / `--ubm-shadow-md` / `--ubm-radius-sm` / `--ubm-space-1` / `--ubm-space-2` / `--ubm-dur-fast` は `tokens.css` に実在）。

```css
.ubm-shell-tooltip-wrap {
  position: relative;
  display: block; /* nav リンクの clickable 幅維持（Phase 3 リスク緩和）。実装時 layout 確認 */
}

.ubm-shell-tooltip {
  position: absolute;
  left: calc(100% + var(--ubm-space-2)); /* collapsed sidebar の右側へ吹き出す */
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;                            /* drawer(40) より下・本文より上 */
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
  font-size: var(--ubm-text-xs, 12px);   /* --ubm-text-xs 未定義時 12px fallback */
  transition: opacity var(--ubm-dur-fast) ease, visibility var(--ubm-dur-fast) ease;
}

.ubm-shell-tooltip-wrap:hover .ubm-shell-tooltip,
.ubm-shell-tooltip-wrap:focus-within .ubm-shell-tooltip {
  opacity: 1;
  visibility: visible;
}
```

> `z-index: 30` / `opacity` / `space` は色 token 規約の対象外（`verify-design-tokens` は色のみ検査）。

### B. 公開フッター `position: sticky; bottom: 0`（`legacy-public.css`）

`[data-component="public-footer"]` の base ブロックへ追加する:

```css
[data-component="public-footer"] {
  /* 既存（C4） */
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px 28px;
  margin-top: auto;
  /* 追加（Lane B） */
  position: sticky;
  bottom: 0;
  z-index: 20;                              /* drawer(40)・mobile-bar(30) より下、本文より上 */
  background: var(--ubm-color-surface-bg);  /* 不透明化（AC-B2） */
  /* 既存継続 */
  border-top: 1px solid var(--ubm-color-border-default);
  color: var(--ubm-color-text-secondary);
  font-size: 12px;
}
```

- containing block は `main`。コンテンツが viewport より高い間、`sticky; bottom: 0` がフッターを viewport 下端へピン留めし、最下部到達時に自然配置へ戻る（常時表示・AC-B1）。
- mobile media block（`legacy-public.css:1197` 付近）は padding/gap のみ上書きで `position` を上書きしないことを実装時に確認（base の sticky が継承される）。
- `main` / `div.flex-1.flex-col` / `shell-root` に `overflow: hidden/clip` が無いことを grep 確認（sticky は最近接スクロール祖先基準）。
- `<aside data-shell="sidebar">` と collapsed 時の `SidebarNav` は tooltip を外側へ出すため `overflow-visible`（`overflow-hidden` / `overflow-y-auto` は tooltip をクリップする）。

### C. mobile-bar `sticky top-0 z-30`（`SidebarShell.tsx`）

```tsx
<div
  data-shell="mobile-bar"
  className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] px-3 py-2 md:hidden"
>
```

- `sticky top-0`: viewport 上端へピン留め（AC-C1）。`< md` で `<aside>` は hidden、mobile-bar は `div.flex-1.flex-col` 内でスクロール祖先は body。
- `z-30`: drawer（`z-40`）より下・本文より上（AC-C2）。
- `md:hidden`: 不変（AC-C3）。背景 `bg-[var(--shell-bar-bg)]` は既存のまま不透明。

### z-index 階層表（全レーン整合）

| 要素 | z-index | 根拠 |
|------|---------|------|
| `SidebarDrawer`（モバイル overlay） | 40 | 最前面 |
| `SidebarShell` mobile-bar | 30 | drawer の下・本文の上（AC-C2） |
| `SidebarTooltip` バブル | 30 | collapsed sidebar 上で本文より前面。drawer 表示時は `< md` で sidebar hidden のため衝突しない |
| 公開フッター | 20 | 本文の上・mobile-bar/drawer の下 |
| user-menu popover | 20（既存） | footer と同階層（同時表示しない） |

### 変更ファイル表（scope_files = artifacts.json と一致）

| # | path | レーン | 種別 |
|---|------|--------|------|
| 1 | `apps/web/src/components/shell/SidebarTooltip.tsx` | A | 新規 |
| 2 | `apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx` | A | 新規 test |
| 3 | `apps/web/src/components/shell/SidebarNavItem.tsx` | A | 編集 |
| 4 | `apps/web/src/components/shell/SidebarUserMenu.tsx` | A | 編集 |
| 5 | `apps/web/src/components/shell/SidebarCollapseToggle.tsx` | A | 編集 |
| 6 | `apps/web/src/components/shell/SidebarShell.tsx` | A + C | 編集 |
| 7 | `apps/web/src/components/shell/SidebarNav.tsx` | A | 編集（collapsed 時 overflow-visible） |
| 8 | `apps/web/src/components/shell/SidebarNavGroup.tsx` | A | 編集（collapsed item 幅安定化） |
| 9 | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | A | 編集 |
| 10 | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | A + C | 編集 |
| 11 | `apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx` | A | 新規 |
| 12 | `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | A | 編集 |
| 13 | `apps/web/src/styles/globals.css` | A | 編集 |
| 14 | `apps/web/src/styles/legacy-public.css` | B | 編集 |

### 不変条件遵守（I-1..I-8）

- **I-1**: `apps/api` / D1 / Google Form / auth 差分 0（純 `apps/web` UI）。
- **I-2**: 色・寸法は token 経由。HEX / `bg-[#xxx]` / `text-[#xxx]` ゼロ（`verify-design-tokens` 対象）。
- **I-3**: 新規 primitive は `SidebarTooltip` 1 個のみ（`components/ui/` の汎用 primitive 不追加）。
- **I-4**: state owner は `useSidebarState` 1 系。ツールチップは CSS 駆動で JS state なし。
- **I-5**: collapsed 判定は既存 `collapsed` prop 由来（新規 source なし）。
- **I-6**: breakpoint は CSS `md:` 正本。`md:hidden` 不変、`sticky top-0 z-30` のみ追加。
- **I-7**: 新規 test は `*.spec.{ts,tsx}` のみ。
- **I-8**: 既存 a11y（aria-label / sr-only / aria-current / drawer role）を壊さず二重読み上げにしない。

### APIシグネチャ

| 公開 surface | シグネチャ | 戻り値 |
|--------------|-----------|--------|
| `SidebarTooltip` | `function SidebarTooltip(props: SidebarTooltipProps): ReactElement` | `collapsed=false` は `children` をそのまま返し、`collapsed=true` は wrap した `<span>` ツリーを返す |
| `SidebarTooltipProps.label` | `readonly label: string` | ツールチップに表示する文字列（= trigger の accessible name と同義） |
| `SidebarTooltipProps.collapsed` | `readonly collapsed: boolean` | 既存 `collapsed` prop をそのまま伝播（新規 source なし・I-5） |
| `SidebarTooltipProps.children` | `readonly children: ReactElement` | 単一 React 要素（`cloneElement` で `aria-describedby` 注入） |

### 使用例

```tsx
// SidebarNavItem.tsx（通常リンク分岐・collapsed のみ wrap）
const link = (
  <Link href={item.href} data-shell-block="nav-item" className={itemClassName}>
    {content}
  </Link>
);
return <li>{collapsed ? <SidebarTooltip label={item.label} collapsed>{link}</SidebarTooltip> : link}</li>;
```

```tsx
// SidebarCollapseToggle.tsx（collapsed のみ wrap）
const button = <button type="button" aria-label="サイドバーを展開" ...>{icon}</button>;
return collapsed ? <SidebarTooltip label="サイドバーを展開" collapsed>{button}</SidebarTooltip> : button;
```

### エラーハンドリング

| 状況 | 方針 |
|------|------|
| `children` が複数要素 / Fragment | `cloneElement` は単一要素前提。呼出側は必ず単一の `<Link>` / `<a>` / `<button>` を渡す（Phase 4 で型・テストにより担保）。配列を渡さない |
| `label` が空文字 | バブルは空表示になるが throw しない（防御的に空文字許容）。collapsed の各呼出は固定文字列を渡すため実害なし |
| trigger に既存 `aria-describedby` あり | 上書きせず space 区切りで連結（`[existing, tooltipId].filter(Boolean).join(" ")`）。description の喪失を防ぐ |
| `<details>/<summary>` への適用 | wrap 不可のため `SidebarTooltip` を使わず inline バブル（D-3）。誤って `<summary>` を wrap しない |

### エッジケース

| ケース | 期待挙動 |
|--------|---------|
| expanded（`collapsed=false`） | wrap せず children 直返し。tooltip DOM を一切追加しない（AC-A2） |
| viewer の user menu（collapsed） | accessible name は既存 `aria-label="ユーザーメニュー"` を維持。既存 `sr-only "ログイン"` も保持し二重読み上げにしない（I-8） |
| nav item の active（aria-current=page） | tooltip wrap 追加後も `data-active` / `aria-current` の既存挙動が壊れないこと（Phase 6 回帰 guard） |
| footer 祖先に `overflow: hidden` / collapsed sidebar nav に clipping overflow | sticky が祖先に限定される / tooltip が sidebar 外へ出ない → Phase 5 で `main`/`flex-1.flex-col`/`shell-root` の overflow と `<aside>` / collapsed `SidebarNav` の `overflow-visible` を grep 確認 |
| タッチデバイス（hover 不可） | collapsed sidebar は `md+` のみ存在（`< md` は drawer で expanded ラベル可視）。タッチ hover は構造的に対象外（スコープ外） |

### 設定項目と定数一覧

| 定数 / token | 値 | 用途 |
|--------------|-----|------|
| tooltip z-index | `30` | drawer(40) の下・本文の上 |
| mobile-bar z-index | `z-30`（Tailwind） | drawer(40) の下・本文の上（AC-C2） |
| footer z-index | `20` | mobile-bar/drawer の下・本文の上 |
| `--ubm-color-surface-panel` | tokens.css 実在 | tooltip 背景 |
| `--ubm-color-surface-bg` | tokens.css 実在 | footer 背景（不透明化） |
| `--ubm-color-border-default` | tokens.css 実在 | tooltip 枠線 |
| `--ubm-color-text-primary` | tokens.css 実在 | tooltip 文字色 |
| `--ubm-shadow-md` / `--ubm-radius-sm` / `--ubm-space-1` / `--ubm-space-2` / `--ubm-dur-fast` | tokens.css 実在 | tooltip 影 / 角丸 / padding / transition |
| `--ubm-text-xs` | `11px`（未定義時 `12px` fallback） | tooltip font-size |

### テスト構成

| spec | 主ケース | 対応 AC |
|------|----------|---------|
| `SidebarTooltip.spec.tsx`（新規） | collapsed=true で `role="tooltip"`=label / collapsed=false パススルー / `aria-describedby` 単独注入 / 既存 describedby 連結 | AC-A1 / A2 / A3 |
| `SidebarNavItem.spec.tsx`（編集） | collapsed で tooltip wrap + `data-shell-block="nav-item"` 存続 / expanded で非 wrap / aria-current 回帰 | AC-A1 / A2 / A6 |
| `SidebarShell.spec.tsx`（編集） | mobile-bar の `sticky`/`top-0`/`z-30`/`md:hidden` class / AdminPublicReturn の tooltip 化 | AC-C1 / C2 / C3 / A5 |
| `SidebarCollapseToggle.spec.tsx`（新規） | collapsed で tooltip / expanded で非 | AC-A5 |
| Lane B（footer sticky） | jsdom で sticky 非観測 → `legacy-public.css` の文字列 grep + Phase 11 Playwright visual | AC-B1 / B2 / B3 |

---

## 視覚証跡

本タスクは **VISUAL** カテゴリ。検証する canonical screenshot は次の 3 件:

| # | canonical 名 | 対象 | 取得状態 |
|---|--------------|------|----------|
| 1 | `sidebar-collapsed-tooltip.png` | collapsed サイドバーで nav item ホバー → ツールチップ表示 | pending（staging visual user gate） |
| 2 | `public-footer-sticky-bottom.png` | 公開ページをスクロール中もフッターが下端固定 | pending（staging visual user gate） |
| 3 | `mobile-header-sticky.png` | スマホ表示でスクロール中も mobile-bar が上端固定 | pending（staging visual user gate） |

> 実コードと semantic tests は反映済み。screenshot は staging visual user gate で取得するため pending。screenshot の捏造は行わない。Lane B / C は CSS `sticky` のため jsdom unit test では sticky 挙動を検証できず、主検証は Phase 11 Playwright visual baseline + 手動スクロール確認（honest scope・Phase 4 で明記）。
