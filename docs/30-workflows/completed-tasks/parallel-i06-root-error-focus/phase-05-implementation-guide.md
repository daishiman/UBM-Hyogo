---
phase: 5
title: 実装ガイド — Before / After 完全コード
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 5 — 実装ガイド

[実装区分: 実装仕様書]

## 1. 対象ファイル

| Path | 種別 |
|------|------|
| `apps/web/app/error.tsx` | 編集 |
| `apps/web/app/error.spec.tsx` | 新規 |

## 2. `apps/web/app/error.tsx` 差分

### Before（現行 L1-L20）

```tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { logger } from "../src/lib/logger";

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
```

### After（4 行の差分）

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";              // ← T-01: useRef 追加
import { logger } from "../src/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);  // ← T-02: ref 生成

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      digest: error.digest,
      err: error,
    });
    headingRef.current?.focus({ preventScroll: true }); // ← T-03: focus 呼び出し
  }, [error]);
```

### h1 要素の編集（T-04）

```tsx
// Before
<h1 className="text-2xl font-semibold text-danger">
  画面を表示できませんでした
</h1>

// After
<h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-danger">
  画面を表示できませんでした
</h1>
```

その他の JSX / styling / Link / reset button は **一切変更しない**。

## 3. `apps/web/app/error.spec.tsx` 新規作成

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RouteError from "./error";

describe("RouteError", () => {
  it("マウント直後に h1 へ自動 focus が当たる", () => {
    render(<RouteError error={new Error("boom")} reset={() => {}} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveFocus();
  });

  it("digest が渡された場合は画面に表示する", () => {
    const err = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<RouteError error={err} reset={() => {}} />);
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });
});
```

> 既存 `error.spec.tsx` が存在する場合は **追記** とし、既存ケースは削除しない。

## 4. 実装手順

1. `apps/web/app/error.tsx` を開き、L4 の `useEffect` import を `useEffect, useRef` に編集。
2. `RouteError` 本体 L13 直後（`useEffect` の前）に `const headingRef = useRef<HTMLHeadingElement>(null);` を追加。
3. 既存 `useEffect` 本体の最後（`}, [error]);` の直前）に `headingRef.current?.focus({ preventScroll: true });` を追加。
4. 既存 h1 開始タグに `ref={headingRef} tabIndex={-1}` を追加。
5. `apps/web/app/error.spec.tsx` を新規作成し、上記コードを貼り付け。
6. `mise exec -- pnpm typecheck` を実行（PASS 必須）。
7. `mise exec -- pnpm lint` を実行（PASS 必須）。
8. `mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/error.spec.tsx` を実行（2 ケース PASS）。

## 5. 完了判定（実装者向け）

- `git diff apps/web/app/error.tsx` の追加行が 4 行のみ
- `git diff --name-status` で `apps/web/app/error.spec.tsx` が追加または変更として含まれる
- 3 gate（typecheck / lint / test）が green
