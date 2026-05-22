# Phase 2: 設計

## コンポーネント設計

### CallToActionCTA.tsx

```tsx
// HomePage 末尾 "FOR MEMBERS" dark variant CTA section（prototype pages-public.jsx:136-149）
// 不変条件 #7: 外部 link 遷移（target="_blank" + rel="noopener noreferrer"）

import type { ReactElement } from "react";

export interface CallToActionCTAProps {
  readonly responderUrl: string;
  readonly heading?: string;
  readonly body?: string;
  readonly ctaLabel?: string;
}

export function CallToActionCTA({
  responderUrl,
  heading = "メンバー情報の掲載をお願いします",
  body = "最新の Google フォームから回答するだけで、このページに自動で反映されます。表記の修正は管理者が編集できます。",
  ctaLabel = "回答フォームを開く",
}: CallToActionCTAProps): ReactElement {
  return (
    <section
      data-component="call-to-action-cta"
      data-variant="dark"
      className="call-to-action-cta"
    >
      <div className="call-to-action-cta__inner">
        <div className="call-to-action-cta__copy">
          <p className="call-to-action-cta__eyebrow">FOR MEMBERS</p>
          <h2 className="call-to-action-cta__heading">{heading}</h2>
          <p className="call-to-action-cta__body">{body}</p>
        </div>
        <a
          href={responderUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-role="call-to-action-cta-button"
          className="cta-button cta-button--accent"
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
```

### constants

`apps/web/src/lib/constants/form.ts`:

```ts
// CLAUDE.md 固定値（不変条件）
// Google Form 回答 URL — リポジトリ全体で hardcode 禁止、本定数経由で参照する
export const FORM_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform" as const;
```

### HomePage 統合

`apps/web/app/page.tsx` の `<main data-page="home">` 末尾（MemberGrid section の後）に mount:

```tsx
import { CallToActionCTA } from "../src/components/public/CallToActionCTA";
import { FORM_RESPONDER_URL } from "../src/lib/constants/form";

// ...
<main data-page="home">
  <Hero ... />
  <Stats ... />
  <ZoneIntro />
  <Timeline ... />
  {members.items.length > 0 ? (
    <section data-component="featured-members">...</section>
  ) : null}
  <CallToActionCTA responderUrl={FORM_RESPONDER_URL} />
</main>
```

> AC-2 に基づき `CallToActionCTA` は条件分岐 **外** に配置し、members 件数によらず常時表示する。

### CSS 設計（legacy-public.css 追加分）

`apps/web/src/styles/legacy-public.css` の `@layer components` 内に追加:

```css
@layer components {
  [data-component="call-to-action-cta"] {
    display: block;
    padding: var(--space-8) var(--space-6);
    margin-top: var(--space-10);
    background: var(--ubm-color-text); /* dark surface */
    color: var(--ubm-color-panel);
    border-radius: var(--radius-lg);
  }

  [data-component="call-to-action-cta"] .call-to-action-cta__inner {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
    justify-content: space-between;
    align-items: center;
  }

  [data-component="call-to-action-cta"] .call-to-action-cta__copy {
    max-width: 32rem;
  }

  [data-component="call-to-action-cta"] .call-to-action-cta__eyebrow {
    font-size: var(--text-xs);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: color-mix(in oklch, white 60%, transparent);
    margin: 0;
  }

  [data-component="call-to-action-cta"] .call-to-action-cta__heading {
    margin-top: var(--space-2);
    color: inherit;
  }

  [data-component="call-to-action-cta"] .call-to-action-cta__body {
    margin-top: var(--space-2);
    color: color-mix(in oklch, white 70%, transparent);
  }
}
```

> 利用するカラー token は `tokens.css` の OKLch 既存 token のみ。新規 token 追加なし。`--ubm-color-text` / `--ubm-color-panel` / `--space-*` / `--radius-lg` / `--text-xs` は既存定義を参照（Phase 5 着手前に grep で存在確認すること）。

## 関数シグネチャ

```ts
export interface CallToActionCTAProps {
  readonly responderUrl: string;
  readonly heading?: string;
  readonly body?: string;
  readonly ctaLabel?: string;
}

export function CallToActionCTA(props: CallToActionCTAProps): ReactElement;

export const FORM_RESPONDER_URL: string;
```

## 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | `responderUrl` 必須（その他 3 props は default 値あり） |
| 出力 | `<section data-component="call-to-action-cta" data-variant="dark">` を含む単一 React 要素 |
| 副作用 | anchor click で新タブ遷移（`target="_blank"`）。状態管理・API call なし |

## 再利用可否（FB-SDK-07-1）

- `RegisterCallout` は light variant・Card ベース・register-callout 固有 layout を持つため、共通化せず別 component として実装する（親 spec の判断踏襲）
- `cta-button` class は `RegisterCallout` でも利用されているため再利用する

## 命名一貫性（FB-SDK-07-4）

- `data-role` 属性: `RegisterCallout` の `data-role="register-cta"` に倣い、`data-role="call-to-action-cta-button"` を採用
- `data-variant` 属性は本 task で初導入

## ステップ間 state 引き渡し

該当なし（単一コンポーネント・state なし・pure function 的）

## 成果物

`outputs/phase-2/design.md`
