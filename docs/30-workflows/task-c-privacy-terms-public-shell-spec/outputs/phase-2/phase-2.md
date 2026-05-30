# Phase 2 — 設計

## 1. アーキテクチャ概要

`/privacy`, `/terms` は Next.js App Router の static Server Component。Task A で導入される `getAuthView()`（`apps/web/src/lib/auth-view.ts`）を経由して session を解決し、`<PublicHeader authView={...} />` + `<PublicFooter />` を root `<div>` 配下に mount する。

```
app/privacy/page.tsx  (async Server Component)
└── <div data-testid="public-shell" data-route-group="public" data-theme="warm">
    ├── <header data-shell="topbar">    <PublicHeader authView={authView} />
    ├── <main   data-page="privacy">    <LegalProse>{...既存本文}</LegalProse>
    └── <footer data-shell="footer">    <PublicFooter />
```

`/terms/page.tsx` は `data-page="terms"` のみ差分。

## 2. 変更対象ファイル

| # | パス | 種別 | 概要 |
|---|------|------|------|
| 1 | `apps/web/app/privacy/page.tsx` | 編集 | async 化 + shell ラップ |
| 2 | `apps/web/app/terms/page.tsx` | 編集 | async 化 + shell ラップ |
| 3 | `apps/web/app/privacy/__tests__/page.spec.tsx` | 新規 | shell / header / footer / h1 / metadata 固定 |
| 4 | `apps/web/app/terms/__tests__/page.spec.tsx` | 新規 | 同上 |

## 3. 関数 / コンポーネントシグネチャ

```tsx
// apps/web/app/privacy/page.tsx
import type { Metadata } from "next";
import { LegalProse } from "../../src/components/legal/LegalProse";
import { PublicHeader } from "../../src/components/public/PublicHeader";
import { PublicFooter } from "../../src/components/public/PublicFooter";
import { getAuthView } from "../../src/lib/auth-view";

export const metadata: Metadata = {
  title: "プライバシーポリシー | UBM 兵庫支部会",
  description: "UBM 兵庫支部会のプライバシーポリシー",
};

export default async function PrivacyPage(): Promise<JSX.Element> {
  const authView = await getAuthView();
  return (
    <div
      className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-theme="warm"
      data-route-group="public"
      data-testid="public-shell"
    >
      <header data-shell="topbar">
        <PublicHeader authView={authView} />
      </header>
      <main data-page="privacy" data-route="public" data-section-rhythm="comfortable">
        <LegalProse>
          {/* 既存本文をそのまま */}
        </LegalProse>
      </main>
      <footer data-shell="footer">
        <PublicFooter />
      </footer>
    </div>
  );
}
```

`/terms/page.tsx` は `data-page="terms"`、metadata `title: "利用規約 | UBM 兵庫支部会"`, `description: "UBM 兵庫支部会の利用規約"`、`<h1>利用規約</h1>` 本文以外同型。

## 4. データフロー / 副作用

- 入力: HTTP GET (`/privacy` or `/terms`)、Cookie/Auth.js session
- 副作用: なし（Server Component が `getAuthView()` を await のみ）
- 出力: HTML（SSR）

## 5. エラーハンドリング

- `getAuthView()` が throw した場合、Task A 設計により内部で guest fallback。Task C 側で try/catch しない（fail-closed は Task A 責務）。
- LegalProse / metadata は変更しないため runtime 影響なし。

## 6. token / 不変条件遵守

- `className` 内の色指定は `var(--ubm-color-surface-bg)` / `var(--ubm-color-text-primary)` のみ利用、HEX 直書き禁止
- 既存 `<main>` の `data-page` / `data-route` / `data-section-rhythm` 属性を保存
- `(public)` route group へ移動しない
