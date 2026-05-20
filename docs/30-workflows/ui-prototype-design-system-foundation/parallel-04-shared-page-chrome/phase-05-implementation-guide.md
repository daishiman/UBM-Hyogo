---
phase: 5
title: 実装ガイド — 4 ファイルの JSX 構造・関数シグネチャ・import 順序
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 5 — 実装ガイド

[実装区分: 実装仕様書]

本 Phase は実装者が **そのまま参照して編集できる** レベルの詳細を提示する。コード変更は Phase 7 の品質ゲート確認後にコミットする。

## 1. `apps/web/app/layout.tsx`（編集）

### 1.1 絶対パス

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/app/layout.tsx`

### 1.2 import 順序（厳守）

```ts
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/styles/tokens.css";   // 1st: OKLch 変数
import "@/styles/globals.css";  // 2nd: Tailwind v4 bridge + @layer components
import { ToastProvider } from "@/components/ui/Toast";
```

### 1.3 関数シグネチャと JSX 構造

```tsx
export const metadata: Metadata = {
  title: {
    default: "UBM Hyogo",
    template: "%s | UBM Hyogo",
  },
  description: "UBM 兵庫支部会 メンバーサイト",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "oklch(0.99 0.01 95)",
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="ja" data-theme="warm">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

### 1.4 既存からの差分（要約）

- 追加: `Viewport` import / `tokens.css` import / `data-theme="warm"` / `viewport` export / `metadata.title` を object 形式に変更
- 維持: ToastProvider 配置 / `lang="ja"` / `globals.css` import
- 削除なし

## 2. `apps/web/app/error.tsx`（編集）

### 2.1 絶対パス

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/app/error.tsx`

### 2.2 import 順序

```ts
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { logger } from "@/lib/logger";
```

> 注: 既存実装は `from "../src/lib/logger"` の相対 import。tsconfig paths に揃えて `@/lib/logger` に統一する。

### 2.3 関数シグネチャと JSX 構造（ErrorCard 派生）

```tsx
type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: Props) {
  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div role="alert" aria-live="assertive" data-page="error" className="mx-auto max-w-2xl px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-danger">画面を表示できませんでした</CardTitle>
          <CardDescription>
            時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error.digest && (
            <p className="text-xs text-text-3">
              エラーID: <code>{error.digest}</code>
            </p>
          )}
          {isDev && (
            <pre className="mt-4 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-xs">
              {error.stack ?? error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-accent px-4 py-2 text-sm text-panel"
          >
            再試行する
          </button>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm"
          >
            トップへ戻る
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 2.4 既存からの差分

- 追加: Card primitive import / Card JSX 構造化 / `data-page="error"`
- 変更: logger import path 相対 → `@/lib/logger` 統一
- 維持: `"use client"` / logger.error 呼び出し / `isDev` 分岐 / reset button / Link
- 削除: `<h1>` 直書き → CardTitle に移譲

> **注**: `CardFooter` が `Card.tsx` に存在するか未確認の場合は、`<div className="ui-card-content flex gap-3">` で代替してよい。型 export は `CardFooterProps` まで存在する（Card.tsx:9 で確認済）。

## 3. `apps/web/app/not-found.tsx`（編集）

### 3.1 絶対パス

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/app/not-found.tsx`

### 3.2 import 順序

```ts
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
```

### 3.3 関数シグネチャと JSX 構造（NotFoundCard 派生）

```tsx
export default function NotFound() {
  return (
    <main
      aria-labelledby="not-found-title"
      data-page="not-found"
      data-testid="not-found"
      className="mx-auto max-w-xl px-6 py-16"
    >
      <Card>
        <EmptyState
          title="ページが見つかりません"
          description="URL をご確認のうえ、トップから再度アクセスしてください。"
          action={
            <div className="flex justify-center gap-3">
              <Link
                href="/"
                className="inline-block rounded-md bg-accent px-4 py-2 text-sm text-panel"
              >
                トップへ戻る
              </Link>
              <Link
                href="/members"
                className="inline-block rounded-md border border-border px-4 py-2 text-sm"
              >
                メンバー一覧へ
              </Link>
            </div>
          }
        >
          <p className="text-sm text-text-3">404</p>
          <h1 id="not-found-title" className="sr-only">
            ページが見つかりません
          </h1>
        </EmptyState>
      </Card>
    </main>
  );
}
```

### 3.4 既存からの差分

- 追加: Card + EmptyState primitive
- 維持: a11y 属性 / data-page / data-testid / 2 つの Link / 「404」表示
- 変更: utility 構成 → primitive 構成

## 4. `apps/web/app/loading.tsx`（編集）

### 4.1 絶対パス

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/app/loading.tsx`

### 4.2 import 順序

```ts
import { Card, CardContent } from "@/components/ui/Card";
```

### 4.3 関数シグネチャと JSX 構造（SkeletonCard 派生）

```tsx
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-3xl px-6 py-12"
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-page="loading"
    >
      <span className="sr-only">読み込み中</span>
      <Card>
        <CardContent className="space-y-4">
          <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
          <div className="h-4 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-surface-2 motion-safe:animate-pulse" />
          <div className="h-64 rounded bg-surface-2 motion-safe:animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.4 既存からの差分

- 追加: Card / CardContent ラップ
- 維持: a11y 属性 / sr-only / skeleton 矩形 4 段 / `motion-safe:animate-pulse`
- 変更: skeleton 直書き → Card 内 CardContent

> parallel-01 で skeleton 用 class（仮称 `ui-card-skeleton-row`）が定義されたら、`bg-surface-2 motion-safe:animate-pulse` を当該 class に置換する。

## 5. 編集順序（推奨）

1. `app/layout.tsx`（G1）— tokens.css import を入れることで他 3 ファイルの token 利用が確実になる
2. `app/error.tsx`（G2）— logger import path 変更を含むため typecheck で他の参照影響を確認
3. `app/not-found.tsx`（G3）
4. `app/loading.tsx`（G4）
5. `pnpm typecheck` → `pnpm lint` → `pnpm build`

## 6. 共通注意事項

| 項目 | ルール |
|------|-------|
| HEX 直書き | 禁止（`verify-design-tokens` gate で fail） |
| `bg-[#xxx]` / `text-[#xxx]` | 禁止 |
| `process.env.*` 直参照 | `app/error.tsx` の `NODE_ENV` 分岐のみ許容（`getEnv()` 経由不要なビルド時定数） |
| `console.log` | 禁止。logger 経由 |
| 改行コード | LF |
| インデント | スペース 2 |

## 7. 参照

- Phase 4 契約定義
- `apps/web/src/components/ui/Card.tsx`
- `apps/web/src/components/ui/EmptyState.tsx`
- `apps/web/src/components/ui/Toast.tsx`
- `apps/web/src/lib/logger.ts`
- `apps/web/tsconfig.json` (`@/*` paths)
