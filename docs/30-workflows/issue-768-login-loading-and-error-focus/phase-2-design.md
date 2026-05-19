# Phase 2: 設計

## 1. 変更対象ファイル一覧

| Path | 種別 | 理由 |
|---|---|---|
| `apps/web/app/login/loading.tsx` | create | login route loading boundary 新規作成 |
| `apps/web/app/login/error.tsx` | modify | focus 管理 / aria-live=assertive / digest 表示 / Card layout 追加 |
| `apps/web/app/login/loading.spec.tsx` | create | loading boundary の role / aria 属性検証 |
| `apps/web/app/login/error.spec.tsx` | create | error boundary の focus 移譲 / digest / reset 呼び出し検証 |
| `apps/web/src/styles/globals.css` | conditional modify | `bg-surface-2` utility 未定義時のみ追加（OKLch token 経由） |

## 2. モジュール構造図

```
apps/web/app/login/
├── page.tsx           （既存・変更なし）
├── loading.tsx        ← create: SSR fallback, OKLch skeleton + a11y
├── error.tsx          ← modify: client component, focus 管理 + Card layout
├── loading.spec.tsx   ← create: Vitest + Testing Library
├── error.spec.tsx     ← create: Vitest + Testing Library + focus / digest
└── _components/       （既存・変更なし）
```

## 3. 関数 / 型シグネチャ

### loading.tsx

```ts
import type { ReactElement } from "react";

export default function LoginLoading(): ReactElement;
```

副作用: なし（純粋 SSR fallback）

### error.tsx

```ts
"use client";
export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}
export default function LoginError(props: LoginErrorProps): ReactElement;
```

副作用:
1. `useEffect` 内で `console.error("[login] route error", error)` を実行
2. `useEffect` 内で `headingRef.current?.focus({ preventScroll: true })` を実行

## 4. データフロー

```
[Next.js App Router]
   ├─ navigation / suspense
   │     └─→ LoginLoading() を render（role=status, aria-busy=true）
   │
   └─ SSR/RSC throw
         └─→ LoginError({ error, reset }) を render
                ├─ useEffect: console.error log + h1.focus()
                └─ user click "再読み込み" → reset() → Next.js が boundary 再 try
```

## 5. UI 設計（Card layout 適用）

### LoginLoading

```tsx
import type { ReactElement } from "react";
import { Card, CardContent } from "@/components/ui/Card";

export default function LoginLoading(): ReactElement {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Card>
        <CardContent
          role="status"
          aria-busy="true"
          aria-live="polite"
          className="space-y-4 p-6"
          data-page="login-loading"
        >
          <span className="sr-only">ログイン画面を読み込み中</span>
          <div className="h-12 w-12 rounded bg-surface-2 motion-safe:animate-pulse" />
          <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
          <div className="h-10 rounded bg-surface-2 motion-safe:animate-pulse" />
        </CardContent>
      </Card>
    </main>
  );
}
```

### LoginError

```tsx
"use client";
import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";

export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function LoginError({ error, reset }: LoginErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[login] route error", error);
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Card>
        <CardContent
          role="alert"
          aria-live="assertive"
          data-page="login-error"
          className="space-y-4 p-6"
        >
          <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold">
            ログイン画面でエラーが発生しました
          </h1>
          <p>時間をおいて再度お試しください。</p>
          {error.digest ? (
            <p>
              <code>error id: {error.digest}</code>
            </p>
          ) : null}
          <button type="button" onClick={() => reset()}>
            再読み込み
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
```

## 6. 入出力・副作用定義

| ケース | 入力 | 出力 / 副作用 |
|---|---|---|
| `/login` 初回 navigation 中 | なし | `LoginLoading` が role=status / aria-busy=true で render |
| `/login` SSR/RSC 例外 | `error: Error & { digest? }`, `reset: () => void` | `LoginError` が render、h1 へ focus 移譲、console.error log 出力 |
| digest 付き error | `error.digest = "abc123"` | `<code>error id: abc123</code>` が表示される |
| digest なし error | `error.digest = undefined` | `<code>` 要素が render されない |
| reset button click | click event | `reset()` 呼び出し、Next.js が boundary 再 try |

## 7. `bg-surface-2` utility 確認手順

Phase 5 着手前に以下を実行し、未定義なら `apps/web/src/styles/globals.css` の `@layer utilities` に下記を追加する:

```bash
grep -n "bg-surface-2\|--ubm-color-surface-2" apps/web/src/styles/tokens.css apps/web/src/styles/globals.css
```

未定義時の追加 snippet（HEX 直書き禁止、`var(--ubm-color-surface-2)` 経由）:

```css
@layer utilities {
  .bg-surface-2 { background-color: var(--ubm-color-surface-2); }
}
```

## 8. エラーハンドリング

- `headingRef.current` が null の場合は optional chain `?.focus()` で no-op（StrictMode 二重 render / 初回 render 前を許容）。
- `console.error` の lint 抑止コメント `// eslint-disable-next-line no-console` は既存 `error.tsx` 踏襲。
- `error.digest` の型は `Error & { digest?: string }`（Next.js 公式型）に合わせる。
