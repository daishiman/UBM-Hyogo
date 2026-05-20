---
phase: 4
title: 契約定義 — props / metadata / viewport / 型インターフェース
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 4 — 契約定義

[実装区分: 実装仕様書]

## 1. `app/layout.tsx` の export 契約

### 1.1 デフォルト export

```ts
export default function RootLayout(props: {
  readonly children: ReactNode;
}): JSX.Element;
```

- Server Component（`async` を付ける必要はない）
- 戻り値は `<html>` ルート要素を 1 つだけ含む JSX

### 1.2 `metadata` export

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "UBM Hyogo",
    template: "%s | UBM Hyogo",
  },
  description: "UBM 兵庫支部会 メンバーサイト",
};
```

- `title` は object 形式で `default` / `template` を必ず提供する
- ページ側で `metadata.title = "メンバー一覧"` のように設定すると `メンバー一覧 | UBM Hyogo` に展開される

### 1.3 `viewport` export

```ts
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "oklch(0.99 0.01 95)",
};
```

- `themeColor` は OKLch 文字列リテラル（CSS variable 参照不可）
- `verify-design-tokens` gate は OKLch 文字列を許容（禁止対象は HEX 直書きのみ）

## 2. `app/error.tsx` の props 契約

### 2.1 関数シグネチャ（Next.js 規約）

```ts
"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError(props: Props): JSX.Element;
```

| props | 型 | 由来 | 用途 |
|-------|----|------|------|
| `error` | `Error & { digest?: string }` | React error boundary | エラー本体。`digest` は Next.js が付与する unique id（production の server error 識別子） |
| `reset` | `() => void` | React error boundary | 同じ tree を再 mount して再試行する callback |

### 2.2 ライフサイクル制約

- `useEffect(() => { logger.error(...) }, [error])` で logger に記録する
- render 中に副作用を起こさない（`console.log` / fetch 等を render 内で実行しない）
- `reset` は button の `onClick` に直接バインドする

## 3. `app/not-found.tsx` の契約

### 3.1 関数シグネチャ

```ts
export default function NotFound(): JSX.Element;
```

- props なし
- Server Component（async 不要）
- 戻り値は `<main>` ルート要素

### 3.2 発火経路

- 任意の Server Component から `import { notFound } from "next/navigation"; notFound();` を呼んだとき
- routing で未マッチの URL がアクセスされたとき

### 3.3 a11y 契約

| 属性 | 値 | 理由 |
|------|----|----|
| `aria-labelledby` | `"not-found-title"` | 見出しと領域の関連付け |
| `data-page` | `"not-found"` | Playwright / 統計用 |
| `data-testid` | `"not-found"` | テスト selector |

## 4. `app/loading.tsx` の契約

### 4.1 関数シグネチャ

```ts
export default function Loading(): JSX.Element;
```

- props なし
- Server Component
- 戻り値は `<div role="status">` ルート要素（または `<main>` でも可だが既存実装は `<div>`）

### 4.2 a11y 契約

| 属性 | 値 |
|------|----|
| `role` | `"status"` |
| `aria-busy` | `"true"` |
| `aria-live` | `"polite"` |
| `data-page` | `"loading"` |

スクリーンリーダー用文字列 `<span className="sr-only">読み込み中</span>` を維持する。

## 5. ToastProvider との接続契約

```ts
import { ToastProvider } from "@/components/ui/Toast";
```

- ToastProvider は `apps/web/src/components/ui/Toast.tsx` で `"use client"` 宣言済み
- Props: `{ children: ReactNode }` のみ
- 任意の子孫 Client Component から:

```ts
"use client";
import { useToast } from "@/components/ui/Toast";
const { toast } = useToast();
toast("保存しました", "status"); // or "alert"
```

route group layout（parallel-03）は **ToastProvider を再 import / 再 wrap しない**。

## 6. logger 接続契約

```ts
import { logger } from "@/lib/logger";

logger.error({
  event: "error.boundary.caught",
  digest: error.digest,
  err: error,
});
```

- `event` は string literal で `"error.boundary.caught"` に固定する（dashboard 集計 key）
- `err` は Error オブジェクトをそのまま渡す（logger 側で serialize される）
- 既存 `app/error.tsx` の logger 呼び出し（`apps/web/app/error.tsx:13-19`）と契約一致

## 7. CSS class 命名契約（parallel-01 との接続）

| class 名 | 利用ファイル | 定義場所（parallel-01） |
|---------|-------------|----------------------|
| `ui-card` / `ui-card-header` / `ui-card-content` / `ui-card-footer` / `ui-card-title` / `ui-card-description` | error / not-found / loading | `globals.css` `@layer components` |
| `ui-empty-state` | not-found | 同上 |
| skeleton 矩形 class（命名は parallel-01 確定後に決まる） | loading | 同上 |

> parallel-01 で class 名が確定するまでは、loading.tsx の skeleton は既存 `bg-surface-2` トークンを暫定で利用してよい（HEX 直書きではないため `verify-design-tokens` gate は通る）。

## 8. import path 契約

| 用途 | path |
|------|------|
| Toast | `@/components/ui/Toast` |
| Card 系 | `@/components/ui/Card` |
| EmptyState | `@/components/ui/EmptyState` |
| logger | `@/lib/logger` |
| css | `@/styles/tokens.css` / `@/styles/globals.css` |

`@/` は `apps/web/tsconfig.json` の paths（`"@/*": ["src/*"]`）にマップされる。app 直下のファイル（`apps/web/app/`）からは src 配下を `@/...` で参照する。

## 9. 契約検証手段

| 契約 | 検証 |
|------|------|
| 関数シグネチャ | `pnpm typecheck` |
| metadata / viewport export | Next.js build が消化 → `pnpm build` |
| props 型 | TS strict mode |
| ToastProvider 単一配置 | parallel-03 仕様レビュー + grep `ToastProvider` で `app/` 配下 1 件のみ |
| HEX 直書き禁止 | `verify-design-tokens` CI gate |
| logger event 名 | grep `error.boundary.caught` で error.tsx 1 件のみ |
