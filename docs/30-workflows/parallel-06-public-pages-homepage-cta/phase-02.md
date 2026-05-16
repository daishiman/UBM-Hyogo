# Phase 2: 設計

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (データモデル / 契約) |
| 状態 | completed |

## 目的

CallToActionCTA component と HomePage 統合の設計を確定する。

## コンポーネント設計

### CallToActionCTA

**ファイル**: `apps/web/src/components/public/CallToActionCTA.tsx`

**シグネチャ**:

```ts
export interface CallToActionCTAProps {
  responderUrl: string;
  heading?: string;   // default: "メンバー情報の掲載をお願いします"
  body?: string;      // default: prototype 137-145 行の本文
  ctaLabel?: string;  // default: "回答フォームを開く"
}

export function CallToActionCTA(props: CallToActionCTAProps): JSX.Element;
```

**Markup 構造**:

```tsx
<section
  data-component="call-to-action-cta"
  style={{
    background: "var(--ubm-color-text-primary)",
    color: "var(--ubm-color-surface-panel)",
    padding: "var(--ubm-space-16) var(--ubm-space-6)",
  }}
>
  <div style={{ maxWidth: 1100, marginInline: "auto", display: "flex", flexWrap: "wrap", gap: "var(--ubm-space-6)" }}>
    <div style={{ maxWidth: 520 }}>
      <p>FOR MEMBERS</p>
      <h2>{heading}</h2>
      <p>{body}</p>
    </div>
    <div>
      <a
        href={responderUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-variant="accent"
      >
        {ctaLabel}
      </a>
    </div>
  </div>
</section>
```

**Styling 方針**:

- 既存 public component と同様、React inline style + `--ubm-*` token 参照方式に合わせる
- `background: var(--ubm-color-text-primary); color: var(--ubm-color-surface-panel);`（ダークバリアント）
- レイアウト: `flex-wrap` で desktop は copy / CTA を左右配置、mobile は自然に縦積み
- CTA `<a>` は既存 accent button variant token に整合（`--ubm-color-accent` 系の background、`--ubm-color-text-primary` 系の text-on-accent）

> **実装結果**: `CallToActionCTA.tsx` は `.module.css` を追加せず、既存 public component と同じく inline style で token を参照する。

## HomePage 統合

**ファイル**: `apps/web/app/page.tsx`

**変更箇所**: `featured-members` / `MemberGrid` ブロックの直後に挿入し、HomePage `<main>` の最終セクションにする。`members.items.length === 0` で `MemberGrid` が描画されない場合も CTA は描画する。

```tsx
import { CallToActionCTA } from "@/components/public/CallToActionCTA";
import { FORM_RESPONDER_URL } from "@/lib/constants";

// ...HomePage の return 内
<>
  <Hero ... />
  <Stats ... />
  <ZoneIntro ... />
  <Timeline ... />
  <MemberGrid ... />
  <CallToActionCTA responderUrl={FORM_RESPONDER_URL} />
</>
```

## 定数集約

**ファイル**: `apps/web/src/lib/constants.ts`

```ts
export const FORM_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";
```

- RegisterPage で fallback 用途に同 URL の literal がある場合は `FORM_RESPONDER_URL` 参照へ差し替え

## 完了条件

- 上記シグネチャ・markup・styling 方針が Phase 3 のテスト契約と整合
- 既存 public component のスタイリング方式を確認し、inline token style として実装済
