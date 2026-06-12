---
spec_classification: implementation_spec
state: spec_created
phase: 5
phase_name: 実装
task_id: public-member-common-ui-card-unification
---

# Phase 5: 実装

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| 実装順序 | **Lane A（基盤）→ (Lane B ‖ Lane C)**。Lane A の公開 API（props / data 属性 / `.ui-*` クラス）確定までは B/C 未着手 |
| 副作用 | 新層6プリミティブ + ButtonLink は **全て stateless / 副作用なし**（Server Component 可・`"use client"` 不要） |
| 入出力 | 入力 = props（external）/ 出力 = JSX（data 属性 + `.ui-*` class）。state を持たない |

> スタイルは全て `.ui-*` CSS クラス + data 属性で表現（inline style 禁止 I-3 / HEX 直書き禁止 I-2）。色・余白・radius は `var(--ubm-*)` トークン参照のみ。

---


## 目的

Lane A の共通レイアウト層を実装し、Lane B/C で8画面を新層へ移行する手順（変更対象ファイル・実装骨格）を確定する。

## 実行タスク

1. Lane A: 新層6ファイル（PageShell / PageHeader / SectionCard / ContentCard / Prose / index.ts）+ ButtonLink + CSS（新規 `layout-primitives.css` + `globals.css` 編集）を実装。
2. Lane B: 公開6画面を新層へ移行（page.tsx + 関連 `_components` / `components/public/*` / `components/legal/*`）。
3. Lane C: `/profile` / `/login` を新層へ移行。
4. ButtonLink を `components/ui/index.ts` barrel へ追加。

---

## 1. 変更対象ファイル一覧（新規 / 編集 / 削除）

### Lane A（基盤 — 先行）

| 区分 | パス | 内容 |
|------|------|------|
| 新規 | `apps/web/src/components/ui/layout/PageShell.tsx` | 背景・最大幅・縦リズムの正本 |
| 新規 | `apps/web/src/components/ui/layout/PageHeader.tsx` | eyebrow + h1(serif) + lead + actions |
| 新規 | `apps/web/src/components/ui/layout/SectionCard.tsx` | 見出し付きカード枠の正本 |
| 新規 | `apps/web/src/components/ui/layout/ContentCard.tsx` | 情報1かたまり=1カードの最小単位 |
| 新規 | `apps/web/src/components/ui/layout/Prose.tsx` | 本文タイポの正本 |
| 新規 | `apps/web/src/components/ui/layout/index.ts` | layout 群 barrel（named export） |
| 新規 | `apps/web/src/components/ui/ButtonLink.tsx` | アンカー型ボタンの正本 |
| 新規 | `apps/web/src/styles/layout-primitives.css` | `.ui-page-shell`/`.ui-page-header`/`.ui-section-card`/`.ui-content-card`/`.ui-prose`/`.ui-button-link` |
| 編集 | `apps/web/src/styles/globals.css` | `layout-primitives.css` の `@import`（または `@layer components` に追記） |
| 編集 | `apps/web/src/components/ui/index.ts` | `export * from "./ButtonLink";` を追加 |

### Lane B（公開6画面 — Lane A 完了後）

| 区分 | パス | 移行内容（カード化マッピング表 Phase 1） |
|------|------|------|
| 編集 | `apps/web/app/(public)/page.tsx` | PageShell で全体をラップ。`<a href="/members" data-role="cta-link">` を `ButtonLink` へ置換 |
| 編集 | `apps/web/src/components/public/Hero.tsx` | SectionCard(tone=accent, hero) でラップ |
| 編集 | `apps/web/src/components/public/Stats.tsx` | SectionCard + ContentCard×4（Stat を内包） |
| 編集 | `apps/web/src/components/public/AboutUbm.tsx` | SectionCard + ContentCard×2 |
| 編集 | `apps/web/src/components/public/Timeline.tsx` | SectionCard + ContentCard rows |
| 編集 | `apps/web/src/components/public/CallToActionCTA.tsx` | SectionCard(tone=accent dark)。内部 CTA を ButtonLink へ |
| 編集 | `apps/web/app/(public)/members/page.tsx` | PageShell + PageHeader（actions=DensityToggle）。MemberFilters を SectionCard(subtle) で |
| 編集 | `apps/web/src/components/public/MemberCard.tsx` | ContentCard 基盤に再構成（interactive・`data-density` は MemberCard 側で付与継続） |
| 編集 | `apps/web/app/(public)/members/[id]/page.tsx` | PageShell + PageHeader（lead に戻る導線） |
| 編集 | `apps/web/src/components/public/ProfileHero.tsx` | SectionCard(hero) |
| 編集 | `apps/web/src/components/public/BusinessOverviewSection.tsx` / `MemberTags.tsx` / `MemberLinks.tsx` | 各 SectionCard（grid-2） |
| 編集 | `apps/web/src/components/public/PersonalSection.tsx` / `MessageCard.tsx` | 各 ContentCard |
| 編集 | `apps/web/src/components/public/MemberDetailSections.tsx` | dl/dt/dd ベタ書き → SectionCard + 既存 KVList。`data-section={key}` は SectionCard の `id`/`data-*` 透過で維持（I-7） |
| 編集 | `apps/web/src/components/public/MemberActivity.tsx` | SectionCard |
| 編集 | `apps/web/app/(public)/register/page.tsx` | PageShell + PageHeader（`page-head` div 置換） |
| 編集 | `apps/web/src/components/public/RegisterCallout.tsx`（Card） | SectionCard |
| 編集 | `apps/web/src/components/public/FormPreviewSections.tsx` | SectionCard 群（section ごと） |
| 編集 | `apps/web/app/(public)/privacy/page.tsx` | PageShell + PageHeader |
| 編集 | `apps/web/app/(public)/terms/page.tsx` | PageShell + PageHeader |
| 編集 | `apps/web/src/components/legal/LegalProse.tsx` | `Prose` を呼ぶ薄いラッパへ縮退（h1 は PageHeader へ移譲、本文は SectionCard + Prose） |

> Lane B のコンポーネント実ファイル名は移行着手時に `apps/web/src/components/public/` を再 grep して確定する（上表は Phase 1 マッピングの実ファイル落とし込み。存在しない名は最寄り実装を採用）。

### Lane C（会員 + 認証 — Lane A 完了後・B と並列可）

| 区分 | パス | 移行内容 |
|------|------|------|
| 編集 | `apps/web/app/(member)/profile/page.tsx` | PageShell で全体ラップ |
| 編集 | `apps/web/app/(member)/profile/_components/ProfileHeader.tsx` | PageHeader（actions に EditCta） |
| 編集 | `apps/web/app/(member)/profile/_components/EditCta.tsx` | `.ui-button-ghost` 直書き → `ButtonLink`/`Button`。button name（`/情報を更新する/` 等）不変（I-7） |
| 編集 | `apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx` | SectionCard 内に内包（client のまま） |
| 編集 | `apps/web/app/(member)/profile/_components/ProfilePreview.tsx` | SectionCard(hero-split) |
| 編集 | `apps/web/app/(member)/profile/_components/PublicConsentCallout.tsx` / `VisibilitySummary.tsx` | 各 SectionCard |
| 編集 | `apps/web/app/(member)/profile/_components/ReflectionTimingNote.tsx` | ContentCard(subtle) |
| 編集 | `apps/web/app/(member)/profile/_components/ProfileFields.tsx`（Card + KVList） | SectionCard + 既存 KVList |
| 編集 | `apps/web/app/(member)/profile/_components/RequestActionPanel.tsx` | SectionCard（dialog は維持・`getByRole("dialog")` 不変） |
| 編集 | `apps/web/app/(member)/profile/_components/AttendanceList.tsx` | SectionCard |
| 編集 | `apps/web/app/(auth)/login/page.tsx` / `_components/LoginShell.tsx` | PageShell（bare・max-width=narrow） |
| 編集 | `apps/web/app/(auth)/login/_components/LoginCard.tsx` | SectionCard(auth)。`data-testid="login-card"` / `data-component="login-card"` / `data-state` を SectionCard `data-*` 透過で保持。`.ui-button-primary` 直書き → `Button`/`ButtonLink`（I-7） |

> StatusBanner（profile）は既存 `Banner` をカード内 alert として維持（新層へ移さない・Phase 1 マッピング）。

---

## 2. 各プリミティブの実装骨格

> 共通: `import { cn } from "../../../lib/cn";`（layout 配下は階層が1段深いため相対パスに注意。`ButtonLink.tsx` は `../../lib/cn`）。inline style 禁止のため `style=` を使わず data 属性 + class のみ。

### A-1. PageShell

```tsx
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface PageShellProps {
  children: ReactNode;
  maxWidth?: "narrow" | "default" | "wide";
  background?: "base" | "subtle" | "bare";
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function PageShell({
  children,
  maxWidth = "default",
  background = "base",
  gap = "lg",
  className,
}: PageShellProps) {
  return (
    <div
      className={cn("ui-page-shell", className)}
      data-component="page-shell"
      data-max-width={maxWidth}
      data-bg={background}
      data-gap={gap}
    >
      {children}
    </div>
  );
}
```

### A-2. PageHeader

```tsx
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  align?: "start" | "center";
  className?: string;
}

export function PageHeader({ eyebrow, title, lead, actions, align = "start", className }: PageHeaderProps) {
  return (
    <header className={cn("ui-page-header", className)} data-component="page-header" data-align={align}>
      <div className="ui-page-header__main">
        {eyebrow ? <p className="ui-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="ui-page-header__title">{title}</h1>
        {lead ? <p className="ui-page-header__lead">{lead}</p> : null}
      </div>
      {actions ? <div className="ui-page-header__actions">{actions}</div> : null}
    </header>
  );
}
```

> h1 は `.ui-page-header__title` で `font-family: var(--ubm-font-serif)`。`level:1` を維持（既存 LoginCard 等の h1 契約に整合）。

### A-3. SectionCard

```tsx
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  tone?: "default" | "subtle" | "accent";
  padding?: "sm" | "md" | "lg";
  children: ReactNode;
  as?: "section" | "article" | "div";
  id?: string;
  className?: string;
  /** I-7: 既存 data-testid / data-component / data-state を透過 */
  "data-testid"?: string;
  "data-component"?: string;
}

export function SectionCard({
  title, description, actions, tone = "default", padding = "md",
  children, as: As = "section", id, className, ...rest
}: SectionCardProps) {
  return (
    <As
      {...rest}
      id={id}
      className={cn("ui-section-card", className)}
      data-component={rest["data-component"] ?? "section-card"}
      data-tone={tone}
      data-padding={padding}
    >
      {title ? (
        <header className="ui-section-card__head">
          <div className="ui-section-card__heading">
            <h2 className="ui-section-card__title">{title}</h2>
            {description ? <p className="ui-section-card__description">{description}</p> : null}
          </div>
          {actions ? <div className="ui-section-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="ui-section-card__body">{children}</div>
    </As>
  );
}
```

> **I-7 透過**: `data-testid` / `data-component`（既存値で上書き）/ `data-state` などは `...rest` で spread。LoginCard 置換時に `data-component="login-card"` を渡せば既定の `"section-card"` を上書きできる（`rest["data-component"] ?? "section-card"`）。`data-tone` / `data-padding` は固定で付与。

### A-4. ContentCard

```tsx
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface ContentCardProps {
  heading?: ReactNode;
  media?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  href?: string;
  interactive?: boolean;
  tone?: "default" | "subtle" | "accent";
  padding?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
}

export function ContentCard({
  heading, media, children, footer, href, interactive,
  tone = "default", padding = "md", className, id,
}: ContentCardProps) {
  const common = {
    id,
    className: cn("ui-content-card", className),
    "data-component": "content-card",
    "data-tone": tone,
    "data-padding": padding,
    ...(href && interactive ? { "data-interactive": "true" as const } : {}),
  };
  const body = (
    <>
      {media ? <div className="ui-content-card__media">{media}</div> : null}
      {heading ? <div className="ui-content-card__heading">{heading}</div> : null}
      <div className="ui-content-card__body">{children}</div>
      {footer ? <div className="ui-content-card__footer">{footer}</div> : null}
    </>
  );
  return href ? <a href={href} {...common}>{body}</a> : <article {...common}>{body}</article>;
}
```

> href なし → `<article>`（TC-4-25 / Phase 6 TC-6-2）。`interactive` は `href` ありの時のみ `data-interactive="true"` を出す（TC-4-27/28・Phase 6 TC-6-3 hover 演出なし回帰）。

### A-5. Prose

```tsx
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface ProseProps {
  children: ReactNode;
  size?: "default" | "compact";
  className?: string;
}

export function Prose({ children, size = "default", className }: ProseProps) {
  return (
    <div className={cn("ui-prose", className)} data-component="prose" data-size={size}>
      {children}
    </div>
  );
}
```

> `.ui-prose` 子孫の `h2/h3/p/ul/ol/li/a/strong` にタイポ・余白トークンを CSS で適用（privacy/terms 本文の正本）。

### A-6. ButtonLink（`components/ui/ButtonLink.tsx`）

```tsx
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { buttonVariants } from "./Button";

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "accent" | "ghost" | "soft" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export function ButtonLink({
  variant = "ghost", size = "md", block = false,
  leftIcon, rightIcon, children, className, ...props
}: ButtonLinkProps) {
  return (
    <a {...props} data-variant={variant} className={buttonVariants({ variant, size, block, className })}>
      {leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
    </a>
  );
}
```

> **視覚等価の正本**: `buttonVariants`（Button.tsx）を再利用するため、className は Button と完全一致（`ui-button ui-button-{variant} ui-button-{size}` [+ `ui-button-block`]）。TC-4-41..44 / Phase 6 snapshot で機械保証。`data-variant` も Button と整合。`.ui-button-link` は **追加の差分クラスが必要な場合のみ** CSS 側で `.ui-button` に内包させる（基本は既存 `.ui-button-*` をそのまま使い、anchor 固有の reset = `text-decoration:none` を `.ui-button` が anchor にも効くよう CSS 側で担保）。

### A-7. barrel（`components/ui/layout/index.ts`）

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

ButtonLink は `components/ui/index.ts` 末尾に追加:

```ts
export * from "./ButtonLink";
```

---

## 3. CSS 実装（`layout-primitives.css`）

新規 `apps/web/src/styles/layout-primitives.css` を作成し、`globals.css` から `@import "./layout-primitives.css";`（既存 import 規約に合わせる。`@layer components` 直書きでも可）。全て `var(--ubm-*)` 参照（HEX 直書き禁止 I-2 / inline style 禁止 I-3）。

| セレクタ | data 属性 → トークン解決 |
|---------|------------------------|
| `.ui-page-shell` | `display:flex; flex-direction:column; margin-inline:auto; padding-inline:var(--ubm-space-4)` |
| `.ui-page-shell[data-max-width="narrow"]` / `="default"` / `="wide"` | `max-width: 40rem` / `60rem` / `75rem` |
| `.ui-page-shell[data-bg="base"]` / `="subtle"` / `="bare"` | `background: var(--ubm-color-surface-bg)` / `var(--ubm-color-surface-bg-2)` / `transparent` |
| `.ui-page-shell[data-gap="sm"]` / `="md"` / `="lg"` | `gap: var(--ubm-space-4)` / `var(--ubm-space-6)` / `var(--ubm-space-8)` |
| `.ui-page-header__title` | `font-family: var(--ubm-font-serif)` |
| `.ui-page-header[data-align="center"]` | `text-align:center; align-items:center` |
| `.ui-section-card` | `border-radius: var(--ubm-radius-md); border:1px solid var(--ubm-color-border); box-shadow: var(--ubm-shadow-sm)` |
| `.ui-section-card[data-tone="subtle"]` / `="accent"` | 背景/見出し色をトークンで分岐 |
| `.ui-section-card[data-padding="sm"]` / `="md"` / `="lg"` | `padding: var(--ubm-space-4)` / `var(--ubm-space-6)` / `var(--ubm-space-8)` |
| `.ui-content-card` | `border-radius: var(--ubm-radius-md)`、tone/padding は SectionCard と同体系 |
| `.ui-content-card[data-interactive="true"]:hover` | `box-shadow: var(--ubm-shadow-md); transition: var(--ubm-dur-fast)` |
| `.ui-prose` 子孫（`h2/h3/p/ul/ol/li/a/strong`） | タイポ・余白トークン。`[data-size="compact"]` で行間/サイズを詰める |
| `.ui-button-link` / `a.ui-button` | `text-decoration:none`（anchor を Button と同一見た目に） |

> トークン値は実装着手時に `apps/web/src/styles/tokens.css` を再 grep して正確な変数名（`--ubm-radius-md` / `--ubm-space-*` / `--ubm-color-surface-bg` 等は確認済）を確定する。存在しないトークン（`--ubm-shadow-md` 等）は最寄り既存トークンを採用。

---

## 4. 移行手順（機械可読 ID 引き継ぎ・I-7）

| 状況 | 引き継ぎ方法 |
|------|------------|
| 既存 `data-testid="login-card"` / `data-component="login-card"` / `data-state` を持つカード | SectionCard に `data-testid` / `data-component` / `data-state` を spread で渡す（`...rest`）。`data-component` は既定 `"section-card"` を渡し値で上書き |
| `MemberDetailSections` の `data-section={key}` | SectionCard の `id`（または `data-section` を `...rest` 透過）で維持 |
| EditCta の `getByRole("button", { name: /情報を更新する/ })` | button のテキスト / aria-label 不変。`.ui-button-*` class のみ Button 経由に差し替え |
| `getByRole("search")` / `getByRole("alert")` / `getByRole("status")`（members） | 内側コンポーネント（MemberFilters / Banner）の role を SectionCard でラップしても保持。DOM 二重描画しない |
| h1（`getByRole("heading", { level: 1 })`） | PageHeader の `<h1>` または既存 h1 を維持。`level:1` を 1 個だけ保つ |

> **原則**: 単一 DOM のまま class / 構造を差し替える。testid 重複を生む二重描画はしない（Phase 2 移行戦略）。

---

## 5. 実装順序

```
1. Lane A: layout/*.tsx + index.ts + ButtonLink.tsx + layout-primitives.css + globals.css/index.ts 編集
   → Phase 4 の S1〜S6 spec が GREEN になるまで（focused vitest）
2. Lane A の API（props/data 属性/.ui-* class）凍結を確認
3. Lane B ‖ Lane C を並列着手（page.tsx + _components / components/public / components/legal 編集）
   → 各画面移行後、対象画面の既存 page.spec / component spec が GREEN を維持（I-7・AC-7）
4. 全体: typecheck → lint(verify:no-inline-style/boundaries) → verify:tokens → apps/web vitest → build
```

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| props 設計 | `phase-2-design.md` §A-1..A-7 | シグネチャ・data 属性の正本 |
| カード化マッピング | `phase-1-requirements.md` §カード化マッピング表 | 画面別割当の正本 |
| 既存 Button | `apps/web/src/components/ui/Button.tsx`（`buttonVariants`） | ButtonLink の className 共有元 |
| 既存 Card | `apps/web/src/components/ui/Card.tsx` | SectionCard 合成の className |
| トークン | `apps/web/src/styles/tokens.css` | data 属性 → トークン解決 |
| globals | `apps/web/src/styles/globals.css` | `layout-primitives.css` import 先 |
| barrel | `apps/web/src/components/ui/index.ts` | ButtonLink 追加先 |

---


## 成果物

- `phase-5-implementation.md`（変更対象ファイル一覧[新規/編集/削除] / プリミティブ実装骨格 / 画面別移行手順 / barrel 追加）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] Lane A の6ファイル + ButtonLink + CSS が新規/編集され、`@/components/ui/layout` と `@/components/ui`（ButtonLink）から import 可能。
- [ ] 各プリミティブの実装骨格（props・data 属性・class）が Phase 2 設計と一致。
- [ ] Lane B/C の画面別移行手順（どの既存コンポーネントを何でラップ/置換するか + 機械可読 ID 引き継ぎ）が確定。
- [ ] 実装順序 Lane A →(B‖C)が明記され、ButtonLink barrel 追加手順が含まれる。
