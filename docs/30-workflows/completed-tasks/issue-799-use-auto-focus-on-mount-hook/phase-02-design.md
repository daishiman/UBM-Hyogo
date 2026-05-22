# Phase 02 — 設計

## hook 設計

### ファイル: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`

```ts
"use client";

import { useEffect, type RefObject } from "react";

/**
 * Mount 時に ref.current へ focus({ preventScroll: true }) を 1 回だけ呼ぶ hook。
 * - SSR では useEffect により実行されない
 * - ref.current が null の場合は noop
 * - 再 render では再 focus しない (依存配列空)
 *
 * 用途: Next.js App Router の error boundary 等で h1 を AT へ即時告知する。
 */
export function useAutoFocusOnMount<T extends HTMLElement>(
  ref: RefObject<T | null>,
): void {
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
```

### 入出力

| 項目 | 型 / 値 |
| --- | --- |
| 入力 | `ref: RefObject<T \| null>` (T extends HTMLElement) |
| 戻り値 | `void` |
| 副作用 | mount 直後に `ref.current?.focus({ preventScroll: true })` を 1 回 |
| 依存配列 | 空 `[]`（mount only） |

`options?: FocusOptions` は採用しない。起点 spec では opt-out 可能な API も候補だったが、Issue #799 の実対象は error boundary 見出しであり、scroll 許可の変種を同時に導入すると最小 API ではなくなる。将来 modal/dialog で別挙動が必要になった場合は別 hook として設計する。

### 呼び出し側パターン

```tsx
"use client";
import { useRef } from "react";
import { useAutoFocusOnMount } from "@/lib/a11y/useAutoFocusOnMount";

export default function SomeError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef);
  return (
    <section role="alert" aria-live="assertive">
      <h1 ref={headingRef} tabIndex={-1}>...</h1>
      ...
    </section>
  );
}
```

## 4 boundary の改修方針

| boundary | 改修内容 |
| --- | --- |
| `apps/web/app/error.tsx` (root, i06) | 既存 `useRef + useEffect + focus` を hook 呼び出しに置換。`logger.error` の `useEffect` は別途残す（責務分離） |
| `apps/web/app/login/error.tsx` (i05) | `h1` に `ref` / `tabIndex={-1}` / `aria-live="assertive"` を追加し、`useAutoFocusOnMount` を導入。既存 `console.error` 維持 |
| `apps/web/app/profile/error.tsx` | 同上 |
| `apps/web/app/(admin)/admin/error.tsx` | 同上（現状 `useEffect` 無いので新規 import 追加） |

## test 設計

### hook spec: `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx`

| ケース | 期待 |
| --- | --- |
| C-1 mount 時 ref.current が element | `focus` が 1 回、`{ preventScroll: true }` で呼ばれる |
| C-2 ref.current が null | throw しない、focus 呼ばれない |
| C-3 再 render | focus は 1 回のまま（mount only） |

### boundary component spec（既存 + 新規）

- 既存 `apps/web/app/__tests__/error.component.spec.tsx` の AC 維持
- 新規: `apps/web/app/login/__tests__/error.component.spec.tsx` / `apps/web/app/profile/__tests__/error.component.spec.tsx` / `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx`
- 各 spec で `focus` が `{ preventScroll: true }` で呼ばれることを assert

## エラーハンドリング

- hook 内で try/catch しない（focus() は HTMLElement の標準 API で throw しない設計）
- ref.current が null の場合は optional chaining で noop

## 不変条件遵守

- 不変条件1（API 接続なし、本タスクは frontend hook のみ）: 〇
- 不変条件2（OKLch token）: 既存 boundary の class 名を変更しない、新規 style 追加なし: 〇
- 不変条件3（`*.spec.tsx` 固定）: 〇
- 不変条件8（test 命名）: 〇
