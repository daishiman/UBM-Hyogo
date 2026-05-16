# Implementation Guide

## Part 1: 中学生レベルの説明

学校の掲示板に「入部したい人はこちら」という案内がないと、入りたい人が職員室まで聞きに行く必要があります。このタスクは、ウェブサイトのトップページにも同じような案内を置く作業です。

なぜ必要かというと、メンバー登録に使う Google フォームへの道がトップページで見つけやすくなるからです。今の設計図にはその案内がありますが、実際のトップページにはまだありません。

何をするかは次の 3 つです。

1. トップページの最後に、目立つ案内ブロックを置く。
2. 案内ブロックのボタンから Google フォームを別のタブで開けるようにする。
3. フォームの住所を何度も書かず、一箇所の名前付きメモとしてまとめる。

| 用語 | 日常語での言い換え |
| --- | --- |
| CTA | 「ここを押してね」と知らせる案内 |
| コンポーネント | 何度も使える画面の部品 |
| Google フォーム | 入力して送るためのネット上の用紙 |
| 別タブ | 今のページを残したまま開く新しいページ |
| トークン | 色や余白を決める共通の名前札 |

## Part 2: 技術者向け説明

### Interface

```ts
export interface CallToActionCTAProps {
  responderUrl: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
}

export function CallToActionCTA(props: CallToActionCTAProps): JSX.Element;
```

### Usage

```tsx
import { CallToActionCTA } from "@/components/public/CallToActionCTA";
import { FORM_RESPONDER_URL } from "@/lib/constants";

<CallToActionCTA responderUrl={FORM_RESPONDER_URL} />;
```

### Implementation Notes

- `FORM_RESPONDER_URL` は `apps/web/src/lib/constants.ts` に定義し、RegisterPage fallback と HomePage CTA の共通参照にする。
- `CallToActionCTA` root は `section[data-component="call-to-action-cta"]` とする。
- default copy は `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` の FOR MEMBERS CTA 行に合わせる。
- 外部リンクは `target="_blank"` と `rel="noopener noreferrer"` を必須にする。
- ダーク variant は `background: var(--ubm-color-text-primary); color: var(--ubm-color-surface-panel);` を使い、CTA は `--ubm-color-accent` を使う。HEX 直書きは禁止する。
- `responderUrl` が空文字になる実装は仕様外。呼び出し側は `FORM_RESPONDER_URL` を渡す。

### Phase 11 Screenshots

| Evidence | Path | Result |
| --- | --- | --- |
| Home desktop full-page | `outputs/phase-11/screenshots/home-desktop.png` | captured |
| Home mobile full-page | `outputs/phase-11/screenshots/home-mobile.png` | captured |
| CTA desktop close-up | `outputs/phase-11/screenshots/cta-section-desktop.png` | captured: FOR MEMBERS / h2 / body / CTA visible |
| CTA mobile close-up | `outputs/phase-11/screenshots/cta-section-mobile.png` | captured: mobile wrapping has no overlap |

### Verification

```bash
pnpm exec vitest run --config vitest.config.ts apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx apps/web/app/__tests__/page.spec.tsx
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm --filter @ubm-hyogo/web verify-design-tokens
```

実行結果は `outputs/phase-11/evidence/` に保存済み。`pnpm test` は 206 files / 1447 tests passed / 1 skipped、`pnpm build` は exit 0（既存 Sentry/Prisma warning あり）。
