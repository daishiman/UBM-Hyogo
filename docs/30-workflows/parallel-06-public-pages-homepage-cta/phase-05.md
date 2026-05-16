# Phase 5: 実装 (Green)

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 前 Phase | 4 (テスト戦略 Red) |
| 次 Phase | 6 (リファクタ / 品質) |
| 状態 | completed |

## 目的

Phase 4 で Red 化した spec を GREEN にする最小実装を行う。

## 実装手順

### Step 1: 定数集約

**File**: `apps/web/src/lib/constants.ts`

- 既存ファイル末尾、または既存 form 関連定数の近傍に下記を追加:

```ts
/**
 * Google Form responder URL（CLAUDE.md「フォーム固定値」セクション正本）。
 * 変更時は CLAUDE.md も同時更新する。
 */
export const FORM_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";
```

- `apps/web/src/lib/constants.ts` が存在しない場合は新規作成（既存 import path を `git grep` で確認）。

### Step 2: CallToActionCTA component

**File**: `apps/web/src/components/public/CallToActionCTA.tsx`

```tsx
export interface CallToActionCTAProps {
  responderUrl: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
}

const DEFAULT_EYEBROW = "FOR MEMBERS";
const DEFAULT_HEADING = "メンバー情報の掲載をお願いします";
const DEFAULT_BODY =
  "最新のGoogleフォームから回答するだけで、このページに自動で反映されます。表記の修正は管理者が編集できます。";
const DEFAULT_CTA = "回答フォームを開く";

export function CallToActionCTA({
  responderUrl,
  eyebrow = DEFAULT_EYEBROW,
  heading = DEFAULT_HEADING,
  body = DEFAULT_BODY,
  ctaLabel = DEFAULT_CTA,
}: CallToActionCTAProps) {
  return (
    <section data-component="call-to-action-cta" style={{ background: "var(--ubm-color-text-primary)", color: "var(--ubm-color-surface-panel)" }}>
      {/* inline style + --ubm-* token。詳細は実装ファイルを正とする。 */}
      <a href={responderUrl} target="_blank" rel="noopener noreferrer" data-variant="accent">
        {ctaLabel}
      </a>
    </section>
  );
}
```

> **注**: token 名は `apps/web/src/styles/tokens.css` の実在 `--ubm-*` prefix に固定する。prototype 側の短縮 token 名や存在しない fallback token を持ち込まない。

### Step 3: HomePage 統合

**File**: `apps/web/app/page.tsx`

```diff
+import { CallToActionCTA } from "@/components/public/CallToActionCTA";
+import { FORM_RESPONDER_URL } from "@/lib/constants";

 export default async function HomePage() {
   // ... existing fetch
   return (
     <>
       <Hero ... />
       <Stats ... />
       <ZoneIntro ... />
       <Timeline ... />
       <MemberGrid ... />
+      <CallToActionCTA responderUrl={FORM_RESPONDER_URL} />
     </>
   );
 }
```

### Step 4: RegisterPage fallback 統一

**File**: `apps/web/app/(public)/register/page.tsx`

既存の literal `"https://docs.google.com/forms/d/e/.../viewform"` を `FORM_RESPONDER_URL` import 参照に差し替える。

## 完了条件

- Phase 4 で書いた 4 つのテストケースが GREEN
- `pnpm test` が GREEN
- `pnpm typecheck` GREEN
