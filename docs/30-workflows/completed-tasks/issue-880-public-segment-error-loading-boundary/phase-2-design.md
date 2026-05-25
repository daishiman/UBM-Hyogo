---
phase: 2
title: 設計
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 2 — 設計

[実装区分: 実装仕様書]

## 1. ファイル配置

| Path | 種別 | 役割 |
|------|------|------|
| `apps/web/app/(public)/error.tsx` | 新規 | `(public)` segment の error boundary。Client Component |
| `apps/web/app/(public)/loading.tsx` | 新規 | `(public)` segment の loading skeleton。Server Component（`"use client"` 不要） |
| `apps/web/playwright/tests/public-error-boundary.spec.ts` | 新規 | force-throw smoke 1 ケース |
| `apps/web/app/(public)/error-boundary-smoke/page.tsx` | 新規（test-only） | Playwright force-throw 用の hidden route。`process.env.NODE_ENV === "production"` では `notFound()` |

> **判断**: Playwright force-throw のため hidden route を `apps/web/app/(public)/error-boundary-smoke/page.tsx` に配置する。NODE_ENV ガードで production には漏れない。`(admin)` も将来同等の検証 route を作る必要があるが本タスクのスコープ外。

## 2. `error.tsx` 構造

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "../../src/components/ui/Card";
import { useAutoFocusOnMount } from "../../src/lib/a11y/useAutoFocusOnMount";
import { logger } from "../../src/lib/logger";

export interface PublicErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function PublicError({ error, reset }: PublicErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef);

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      scope: "public",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main
      className="mx-auto max-w-2xl px-6 py-16"
      data-route="public"
      data-page="error"
      data-section-rhythm="compact"
    >
      <Card role="alert" aria-live="assertive">
        <CardHeader>
          <h1 ref={headingRef} tabIndex={-1} className="ui-card-title text-danger">
            ページを表示できませんでした
          </h1>
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
            <pre className="mt-6 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-xs">
              {error.stack ?? error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-accent px-4 py-2 text-sm text-panel"
          >
            再試行する
          </button>
          <Link
            href="/members"
            className="rounded-md border border-border px-4 py-2 text-sm"
          >
            会員一覧へ戻る
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm"
          >
            トップへ戻る
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
```

### 2.1 親 `error.tsx` との差分

- import path 階層が `..` 1 段深い → `../../src/...`
- `scope: "public"` を logger に追加
- 文言を「ページを表示できませんでした」に変更（親は「画面」）
- 導線リンクを 2 本（`/members` + `/`）に増設（親は `/` のみ）

## 3. `loading.tsx` 構造

```tsx
import { Card, CardContent } from "../../src/components/ui/Card";

export default function PublicLoading() {
  return (
    <main
      className="mx-auto max-w-3xl space-y-4 px-6 py-12"
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-page="loading"
      data-route="public"
      data-section-rhythm="compact"
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
    </main>
  );
}
```

### 3.1 親 `loading.tsx` との差分

- 構造はほぼ同一（既存 skeleton を `(public)` AppShell 下でそのまま使う）
- import path の階層差のみ

## 4. force-throw hidden route 構造

```tsx
// apps/web/app/(public)/error-boundary-smoke/page.tsx
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ErrorTriggerPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  throw new Error("public-error-boundary-smoke-trigger");
}
```

## 5. データフロー

```
Server Component throw
  → Next.js App Router が segment ごとに最寄り error.tsx を探索
  → (public)/error.tsx 発火（親 error.tsx を override）
  → logger.error({ scope: "public", ... })
  → Card UI 描画 + reset() / Link 導線
```

## 6. 既存システム影響範囲

| 範囲 | 影響 |
|------|------|
| 親 `apps/web/app/error.tsx` | 影響なし（`(public)` 配下では override されるだけ。他 segment では引き続き動作） |
| `(admin)/admin/error.tsx` | 影響なし |
| `serial-06-form-response-binding` Phase 5 §0 precondition | drift 解消（grep が pass） |
| `verify-design-tokens` CI gate | 新規 2 ファイルが grep 対象に追加されるが、`bg-[#...]` 直書きしないので pass |
