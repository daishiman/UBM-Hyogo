# Phase 5: 実装 — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. 実装ステップ

### Step 1: `apps/web/app/error.tsx` の修正

#### 修正 1: import 文に `useRef` を追加

```diff
- import { useEffect } from "react";
+ import { useEffect, useRef } from "react";
```

#### 修正 2: `RouteError` 関数冒頭で `headingRef` を生成

```diff
  export default function RouteError({ error, reset }: Props) {
+   const headingRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
```

#### 修正 3: 既存 `useEffect` 末尾に focus 呼び出しを追加

```diff
    useEffect(() => {
      logger.error({
        event: "error.boundary.caught",
        digest: error.digest,
        err: error,
      });
+     headingRef.current?.focus({ preventScroll: true });
    }, [error]);
```

#### 修正 4: h1 要素に `ref` と `tabIndex` を付与

```diff
-     <h1 className="text-2xl font-semibold text-danger">
+     <h1
+       ref={headingRef}
+       tabIndex={-1}
+       className="text-2xl font-semibold text-danger"
+     >
        画面を表示できませんでした
      </h1>
```

### Step 2: `apps/web/app/__tests__/error.component.spec.tsx` への TC-U-09 追加

ファイル末尾の最終 `describe` ブロック直前（line 110 付近、TC-U-08 の `describe` 終了直後）に以下を追加:

```tsx
describe("TC-U-09: mount 時に h1 へ focus が移譲される", () => {
  it("focuses h1 on mount", () => {
    const reset = vi.fn();
    render(<RouteError error={makeError({ digest: "focus-test" })} reset={reset} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(document.activeElement).toBe(h1);
  });

  it("h1 has tabIndex=-1 to allow programmatic focus", () => {
    const reset = vi.fn();
    render(<RouteError error={makeError()} reset={reset} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.getAttribute("tabindex")).toBe("-1");
  });

  it("calls focus with preventScroll=true", () => {
    const reset = vi.fn();
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    render(<RouteError error={makeError()} reset={reset} />);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    focusSpy.mockRestore();
  });
});
```

> **追加位置の理由**: 既存の TC-U-01〜TC-U-08 が単一 `describe("RouteError", ...)` の中にネストしているため、TC-U-09 もこの外側 describe の内部に追加すること（必要に応じて閉じカッコ位置を確認）。

## 2. 完成後の `apps/web/app/error.tsx` 全文（参考）

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { logger } from "../src/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      digest: error.digest,
      err: error,
    });
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div role="alert" aria-live="assertive" className="mx-auto max-w-2xl px-6 py-16">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold text-danger"
      >
        画面を表示できませんでした
      </h1>
      <p className="mt-2 text-sm text-text-3">
        時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。
      </p>
      {error.digest && (
        <p className="mt-4 text-xs text-text-3">
          エラーID: <code>{error.digest}</code>
        </p>
      )}
      {isDev && (
        <pre className="mt-6 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-xs">
          {error.stack ?? error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
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
      </div>
    </div>
  );
}
```

## 3. 実装中の禁止事項

- 既存 className の変更
- 文言（「画面を表示できませんでした」「再試行する」「トップへ戻る」「エラーID:」）の変更
- `useEffect` 依存配列 `[error]` の変更
- `logger.error` 引数 shape の変更
- 別 boundary（`/login/error.tsx` 等）への波及修正
- `tabIndex={-1}` 以外の値（0 / 数値を変える）

## 4. 実装後の検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error.component
```

3 つすべて PASS であれば Phase 5 完了。

## 5. ローカルでの動作確認手順（Phase 11 で再実施）

1. `mise exec -- pnpm -F "@ubm-hyogo/web" dev` で dev server 起動
2. 任意の page を開き、開発者ツール console で `throw new Error("test")` を強制発火、または意図的に server component で throw する page をローカルに用意
3. error boundary 発火後、screen reader（VoiceOver / NVDA）で見出しが即座に読み上げられることを確認
4. ビューポートが画面トップへスナップしないことを目視（`preventScroll: true` の効果）
