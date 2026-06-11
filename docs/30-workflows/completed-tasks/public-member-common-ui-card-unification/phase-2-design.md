---
spec_classification: implementation_spec
state: spec_created
phase: 2
phase_name: 設計
task_id: public-member-common-ui-card-unification
---

# Phase 2: 設計

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| 対象 | 共通レイアウト層6ファイル + 8画面移行 |
| topology | Lane A（基盤）→ Lane B（公開） ‖ Lane C（会員/認証） |

---


## 目的

共通レイアウト層6プリミティブ（PageShell/PageHeader/SectionCard/ContentCard/Prose）＋ ButtonLink の props 型・data 属性・CSS クラス・移行戦略を実装可能な粒度で確定する。

## 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 既存 | 再利用方針 |
|------|-----------|
| `components/ui/Card.tsx`（CardHeader/Title/Content/Footer） | **内部合成で再利用**。SectionCard は Card 群を組み立てて padding/tone/radius を強制する上位ラッパとする（Card を破棄しない） |
| `components/ui/Button.tsx` | **そのまま正本**。ButtonLink は Button と同一の className 体系（`.ui-button` + `.ui-button-{variant}` + `.ui-button-{size}`）を anchor で再現 |
| `components/ui/KVList.tsx` / `Badge.tsx` / `Avatar.tsx` / `Banner.tsx` / `Stat.tsx` | **そのまま再利用**（カード内に内包） |
| `components/legal/LegalProse.tsx` | Prose に一般化し、LegalProse は Prose を呼ぶ薄いラッパへ縮退（または置換） |

> 新規 UI 実装は「組み立ての正本」レイヤに限定し、原子プリミティブ（Card/Button/Avatar 等）は既存を温存する。これによりアクセシビリティ・トークン整合を既存レベルで担保する（[FB-SDK-07-1]）。

---

## 状態所有権 / 責務境界

新層は全て**presentational（stateless）**。状態は持たない。

| プリミティブ | 種別 | state |
|------------|------|-------|
| PageShell / PageHeader / SectionCard / ContentCard / Prose / ButtonLink | Server Component 可（`"use client"` 不要） | 持たない |

> client 状態（DensityToggle / フォーム / dialog）は既存 client コンポーネントが保持し続け、新層はその container として slot（`actions` / `children`）で受けるだけ。状態所有権を新層に移さない（責務境界を混在させない）。

---

## プリミティブ設計（props シグネチャ・data 属性・CSS クラス）

### A-1. PageShell（`components/ui/layout/PageShell.tsx`）

```tsx
import type { ReactNode } from "react";

export interface PageShellProps {
  /** 縦に積むセクション群 */
  children: ReactNode;
  /** 最大幅。narrow=640 / default=960 / wide=1200（CSS 側で解決） */
  maxWidth?: "narrow" | "default" | "wide";
  /** 背景。base=surface-bg / subtle=surface-bg-2 / bare=透明（auth等） */
  background?: "base" | "subtle" | "bare";
  /** セクション間の縦リズム。sm/md/lg（gap） */
  gap?: "sm" | "md" | "lg";
  /** 追加クラス（拡張用、原則不要） */
  className?: string;
}

export function PageShell({
  children,
  maxWidth = "default",
  background = "base",
  gap = "lg",
  className,
}: PageShellProps): JSX.Element;
```

- レンダリング: `<div class="ui-page-shell {className}" data-component="page-shell" data-max-width={maxWidth} data-bg={background} data-gap={gap}>{children}</div>`
- CSS（globals.css / 新規 `.ui-page-shell`）:
  - `data-max-width` で `max-width` と中央寄せ余白を解決（`--ubm-space-*` 参照）
  - `data-bg` で背景トークン（`--ubm-color-surface-bg` 等）
  - `data-gap` で `display:flex; flex-direction:column; gap:var(--ubm-space-*)`

### A-2. PageHeader（`components/ui/layout/PageHeader.tsx`）

```tsx
export interface PageHeaderProps {
  /** 見出し上の小ラベル（任意） */
  eyebrow?: ReactNode;
  /** 見出し（h1, serif） */
  title: ReactNode;
  /** 補足リード文（任意） */
  lead?: ReactNode;
  /** 右側アクション（ボタン・トグル等の slot） */
  actions?: ReactNode;
  /** 寄せ。start（既定）/ center */
  align?: "start" | "center";
  className?: string;
}

export function PageHeader(props: PageHeaderProps): JSX.Element;
```

- レンダリング: `<header class="ui-page-header" data-component="page-header" data-align={align}>` 内に `<p class="ui-page-header__eyebrow">` / `<h1 class="ui-page-header__title">` / `<p class="ui-page-header__lead">` / `<div class="ui-page-header__actions">`。
- 既存 `.page-head` を置換。h1 は `--ubm-font-serif`。

### A-3. SectionCard（`components/ui/layout/SectionCard.tsx`）

```tsx
export interface SectionCardProps {
  /** カード見出し（任意。無い場合は枠のみ） */
  title?: ReactNode;
  /** 見出し補足 */
  description?: ReactNode;
  /** 見出し右のアクション slot */
  actions?: ReactNode;
  /** トーン。default / subtle / accent */
  tone?: "default" | "subtle" | "accent";
  /** 内側余白。sm / md（既定）/ lg */
  padding?: "sm" | "md" | "lg";
  /** カード本体 */
  children: ReactNode;
  /** ルート要素タグ（既定 section） */
  as?: "section" | "article" | "div";
  /** 機械可読 ID 維持・追加属性のための透過 props */
  id?: string;
  className?: string;
}

export function SectionCard(props: SectionCardProps): JSX.Element;
```

- レンダリング: `<section class="ui-section-card" data-component="section-card" data-tone={tone} data-padding={padding}>` 内に（title があれば）`<header class="ui-section-card__head">`（title/description/actions）＋ `<div class="ui-section-card__body">{children}</div>`。
- 内部で既存 Card 群の className を流用し radius=`--ubm-radius-md`、border/shadow をトークンで固定。

### A-4. ContentCard（`components/ui/layout/ContentCard.tsx`）

```tsx
export interface ContentCardProps {
  /** カード見出し（任意） */
  heading?: ReactNode;
  /** メディア（Avatar・アイコン等の slot、任意） */
  media?: ReactNode;
  /** 本文 */
  children: ReactNode;
  /** フッタ（メタ情報・リンク等） */
  footer?: ReactNode;
  /** クリック可能カードにする場合のリンク先（指定時 <a> でラップ） */
  href?: string;
  /** href 指定時の interactive ホバー演出 */
  interactive?: boolean;
  tone?: "default" | "subtle" | "accent";
  padding?: "sm" | "md" | "lg";
  className?: string;
}

export function ContentCard(props: ContentCardProps): JSX.Element;
```

- レンダリング: `href` ありなら `<a class="ui-content-card" data-component="content-card" data-interactive="true" href>`、無ければ `<article class="ui-content-card" data-component="content-card">`。内部に `media` / `heading` / `children` / `footer` を順に配置。
- MemberCard はこの ContentCard を基盤に再構成（`data-density` は MemberCard 側で付与し続ける）。

### A-5. Prose（`components/ui/layout/Prose.tsx`）

```tsx
export interface ProseProps {
  children: ReactNode;
  /** 文字サイズリズム。default / compact */
  size?: "default" | "compact";
  className?: string;
}

export function Prose(props: ProseProps): JSX.Element;
```

- レンダリング: `<div class="ui-prose" data-component="prose" data-size={size}>{children}</div>`。
- `.ui-prose` 子孫の `h2/h3/p/ul/ol/li/a/strong` にタイポ・余白トークンを適用（privacy/terms 本文の正本）。

### A-6. ButtonLink（`components/ui/ButtonLink.tsx`）

```tsx
import type { AnchorHTMLAttributes, ReactNode } from "react";

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "accent" | "ghost" | "soft" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export function ButtonLink(props: ButtonLinkProps): JSX.Element;
```

- レンダリング: `<a class="ui-button ui-button-{variant} ui-button-{size} {block?ui-button-block}" data-variant={variant} ...rest>`。Button.tsx と className/data 属性を完全一致させ、見た目を同一にする。

### A-7. barrel export（`components/ui/layout/index.ts`）

```ts
export { PageShell } from "./PageShell";
export type { PageShellProps } from "./PageShell";
export { PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";
export { SectionCard } from "./SectionCard";
export type { SectionCardProps } from "./SectionCard";
export { ContentCard } from "./ContentCard";
export type { ContentCardProps } from "./ContentCard";
export { Prose } from "./Prose";
export type { ProseProps } from "./Prose";
```

> ButtonLink は既存 `components/ui/index.ts` の barrel に追加（Button と同階層）。新規 subpath を増やさない（プロジェクト不変条件「root barrel に新規共有型を足しすぎない」に整合し、`ui/index.ts` 既存経路を使う）。

---

## CSS 設計

- 新規ファイル `apps/web/src/styles/layout-primitives.css` を作り、`globals.css` から `@import`（または globals.css 内 `@layer components` に追記）。`.ui-page-shell` / `.ui-page-header` / `.ui-section-card` / `.ui-content-card` / `.ui-prose` / `.ui-button-link` を定義。
- 全て `var(--ubm-*)` トークン参照。HEX 直書き禁止（I-2）。inline style 禁止（I-3）。
- 既存 `.page-head` / Hero/Stats 固有装飾の重複は Phase 8（リファクタ）で `.ui-*` へ寄せて削減。

| 入力（props/data 属性） | 出力（CSS 解決） |
|------------------------|------------------|
| `data-max-width=narrow\|default\|wide` | `max-width: 40rem\|60rem\|75rem`（トークン化） |
| `data-bg=base\|subtle\|bare` | `background: var(--ubm-color-surface-bg)\|var(--ubm-color-surface-bg-2)\|transparent` |
| `data-tone=default\|subtle\|accent`（SectionCard/ContentCard） | border/背景/見出し色をトークンで分岐 |
| `data-padding=sm\|md\|lg` | `padding: var(--ubm-space-4\|6\|8)` |
| `data-interactive=true`（ContentCard） | hover で shadow/transform（`--ubm-shadow-md` / `--ubm-dur-fast`） |

---

## 移行戦略（Lane B / C）— DOM 構造と機械可読 ID の保全（[FB-VISUAL] / I-7）

- 各画面の page.tsx / 各 `_components/*` を、内側 JSX を新プリミティブで**ラップ／置換**する形で移行。
- **既存の `data-testid` / `aria-label` / `role` は新プリミティブの `id` / 透過 props 経由で必ず引き継ぐ**。例: `MemberDetailSections` の `data-section={key}` は SectionCard の `id`/`data-*` 透過で維持。
- 既存 component spec が参照する selector（`getByRole`, `getByTestId`, `data-component`）を壊さないため、移行前に各画面 spec の selector を棚卸し（Phase 4 で一覧化）。
- DOM を二重描画しない（testid 重複回避）。単一 DOM のまま class/構造を差し替える。

---

## ステップ間 state 引き渡し（該当する client container）

| 画面 | client 状態保持 | 新層への引き渡し |
|------|----------------|-----------------|
| `/members` | DensityToggle（density） | PageHeader `actions` slot に配置、MemberGrid は density を従来通り受領 |
| `/profile` | RequestActionPanel dialog / PhotoUpload | SectionCard 内に既存 client コンポーネントをそのまま内包 |
| `/login` | LoginPanel 状態 | SectionCard（auth）内に LoginPanel を内包 |

> 推論値・状態は既存 client が単独所有。新層は container のみ（state を持たない）。

---

## 実行タスク

1. A-1..A-7 の props 型・data 属性・CSS クラスを確定し、Phase 4 のテスト設計へ渡す。
2. CSS 入出力表（data 属性 → トークン解決）を確定する。
3. 移行戦略（機械可読 ID 保全）を Lane B/C の前提として固定する。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 既存プリミティブ | `apps/web/src/components/ui/Card.tsx` / `Button.tsx` | 合成・className 体系の参照 |
| トークン | `apps/web/src/styles/tokens.css` | data 属性 → トークン解決 |
| globals | `apps/web/src/styles/globals.css` | `@layer components` 追記先 |
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/styles.css` | rhythm / spacing 参照 |

---


## 成果物

- `phase-2-design.md`（プリミティブ props 設計 / CSS 入出力表 / 状態所有権 / 移行戦略 / state 引き渡し表）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] 6プリミティブ全ての props 型・data 属性・CSS クラスが確定。
- [ ] CSS 入出力表・移行戦略・state 引き渡し表が揃い、Phase 3 レビューへ進める。
