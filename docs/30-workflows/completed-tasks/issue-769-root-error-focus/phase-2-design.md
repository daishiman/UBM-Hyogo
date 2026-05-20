# Phase 2: 設計 — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. アーキテクチャ位置づけ

`apps/web/app/error.tsx` は Next.js App Router の **root route error boundary**。client component として動作し、配下の React tree で throw された error を catch して描画する。

```
RootLayout (server)
└── (page)
    └── ErrorBoundary (Next.js が内部生成)
        └── RouteError (= error.tsx, "use client") ← 本タスクの修正対象
            └── <div role="alert" aria-live="assertive">
                └── <h1>画面を表示できませんでした</h1> ← focus 対象
```

## 2. 変更対象ファイルと変更種別

| Path | 種別 | 変更概要 |
|---|---|---|
| `apps/web/app/error.tsx` | modify | `useRef` import / `headingRef` 生成 / useEffect で focus / h1 に `ref` + `tabIndex={-1}` |
| `apps/web/app/__tests__/error.component.spec.tsx` | modify | 既存 TC-U-01〜TC-U-08 に focus 移譲 TC-U-09 を追記（既ファイル運用に合わせる） |

## 3. 関数シグネチャ

```tsx
type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: Props): JSX.Element;
```

**シグネチャ自体は不変**。内部の hook 構成のみ変更する。

## 4. 内部構造（Before / After）

### Before（現状: `apps/web/app/error.tsx` line 1-19）

```tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { logger } from "../src/lib/logger";

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function RouteError({ error, reset }: Props) {
  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      digest: error.digest,
      err: error,
    });
  }, [error]);
  // ...
  return (
    <div role="alert" aria-live="assertive" className="...">
      <h1 className="text-2xl font-semibold text-danger">画面を表示できませんでした</h1>
      ...
    </div>
  );
}
```

### After（目標）

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";        // +useRef
import { logger } from "../src/lib/logger";

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function RouteError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);  // +生成

  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      digest: error.digest,
      err: error,
    });
    headingRef.current?.focus({ preventScroll: true });  // +focus
  }, [error]);
  // ...
  return (
    <div role="alert" aria-live="assertive" className="...">
      <h1
        ref={headingRef}                                  // +ref
        tabIndex={-1}                                     // +tabIndex
        className="text-2xl font-semibold text-danger"
      >
        画面を表示できませんでした
      </h1>
      ...
    </div>
  );
}
```

**差分の合計**: import 1 行修正 / ref 生成 1 行追加 / focus 呼び出し 1 行追加 / h1 props 2 つ追加 = 実質 4 〜 5 行差分。

## 5. 副作用設計

| 副作用 | 発火タイミング | 順序 |
|---|---|---|
| `logger.error(...)` | useEffect 実行時 | 1 |
| `headingRef.current?.focus({ preventScroll: true })` | useEffect 実行時 | 2 |
| cleanup | — | 不要（focus は idempotent） |

依存配列 `[error]` を維持。error prop が変わるたびに log + focus が再走する。

## 6. テストファイル設計 — 既存ファイルへの TC 追記

**追記先**: `apps/web/app/__tests__/error.component.spec.tsx`（既存 8 ケース TC-U-01〜TC-U-08 + 本タスクで TC-U-09 を追加）

digest 表示は既に TC-U-03 / TC-U-04 で検証済み（AC-5 充足済み）。本 Phase で追加するのは **TC-U-09: focus 移譲** のみ。

> **Matcher 制約**: ルート `vitest.config.ts` に setupFiles が無く `@testing-library/jest-dom` 拡張 matcher（`toHaveFocus`, `toHaveAttribute`, `toBeInTheDocument`）は自動拡張されない。**vitest 標準 matcher のみで書く**こと（既存 8 ケースも `not.toBeNull()` / `getByRole` / `toHaveBeenCalledTimes` のみ使用）。

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

  it("calls focus with preventScroll=true (spy on HTMLElement.prototype.focus)", () => {
    const reset = vi.fn();
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    render(<RouteError error={makeError()} reset={reset} />);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    focusSpy.mockRestore();
  });
});
```

> **AC-5 補足**: digest 表示は TC-U-03 / TC-U-04 で既達。本タスクでは re-assert しない。

## 7. logger モック方針

既存ファイル冒頭で既に以下のモックが設定済み（line 4-17）。**新規設定不要**:

```tsx
vi.mock("../../src/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: () => ({...}) },
}));
```

## 8. リスクと対策

| リスク | 対策 |
|---|---|
| `tabIndex={-1}` が visual focus outline を出す | 既存 `:focus-visible` utility（global CSS）で抑制 — CSS 変更不要 |
| `preventScroll: true` 漏れで mobile でビューポートが跳ぶ | After サンプル通り必ず指定 / lint 規約は無いため Phase 9 manual QA で確認 |
| log 失敗時に focus が走らない | logger.error は throw しない実装（既存）。Phase 5 実装時に再確認 |
| `useRef` の初期値 null による non-null assertion | Optional chaining `?.focus()` で安全に呼ぶ |
| hydration mismatch | `tabIndex={-1}` は static prop、SSR / CSR で同一出力。useRef / useEffect は client only で副作用、SSR 影響なし |

## 9. 並列性 / 衝突

- 編集ファイル: `apps/web/app/error.tsx` / `apps/web/app/__tests__/error.component.spec.tsx`
- i05（`apps/web/app/login/error.tsx`）と非重複（AC-10）
- i01〜i04, i07 とも非重複

## 10. Phase 3 への引き継ぎ

Phase 3 では本設計に対し以下を点検:

- 関数シグネチャの不変性
- useEffect 順序の妥当性
- testing-library import path の正しさ
- vitest config が `apps/web/app/*.spec.tsx` を拾うこと
