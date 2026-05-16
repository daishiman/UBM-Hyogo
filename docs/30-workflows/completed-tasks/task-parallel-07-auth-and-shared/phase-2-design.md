# Phase 2: 設計

> Phase: 2 / 13
> 名称: 設計
> 元仕様 §4 を本 Phase に取り込み・詳細化する。

---

## 2.1 `/login/error.tsx`（編集）

### 現状

`main` / `section` / `button` の素朴な構造、Card layout 未適用、focus 管理なし。

### 設計

- `Card` / `CardContent` の named import で外枠を統一
- `data-state="error"` を `Card` に付与（E2E selector 用）
- `role="alert" aria-live="assertive"` を `CardContent` に付与
- `h1` に `ref={headingRef}` + `tabIndex={-1}` を付与し、`useEffect` で `focus({ preventScroll: true })`
- 色は `text-danger` / `bg-surface-1` 等のトークンクラスのみ使用

### JSX 雛形

```tsx
"use client";
import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/Card";

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function LoginError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    console.error("[login] error", error);
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

  return (
    <Card data-state="error" className="mx-auto max-w-md">
      <header className="px-6 pt-6">{/* UBM logo SVG */}</header>
      <CardContent role="alert" aria-live="assertive" className="space-y-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-danger">
          ログイン処理でエラーが発生しました
        </h1>
        {error.digest ? (
          <code className="block rounded bg-surface-2 px-2 py-1 text-xs">{error.digest}</code>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="rounded bg-accent px-4 py-2 text-panel"
        >
          再試行する
        </button>
      </CardContent>
    </Card>
  );
}
```

---

## 2.2 `/login/loading.tsx`（新規作成）

### 設計

- `role="status" aria-busy="true" aria-live="polite"`
- `sr-only` で「ログイン画面を読み込み中」を読み上げ
- OKLch skeleton: `bg-surface-2` + `motion-safe:animate-pulse`
- Login card 形状: ロゴ枠（48px square） / タイトル（h8 w-2/3） / フォーム（h-10）

### JSX 雛形

```tsx
export default function LoginLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-md space-y-4 px-6 py-12"
    >
      <span className="sr-only">ログイン画面を読み込み中</span>
      <div className="h-12 w-12 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-10 rounded bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}
```

---

## 2.3 `/error.tsx`（編集）

### 現状

`role="alert"` / `aria-live` 既実装。focus 管理なし。

### 設計

- `headingRef` を追加し、`h1` への自動 focus を実装
- Card layout は「root scope が広いため任意」とし、視覚的整合のため軽量な枠（既存があれば維持・無ければ Card 化）
- `error.digest` がある場合は `code` 要素でコピーしやすく表示

### 差分方針

既存構造を保ったまま `useEffect` で `headingRef.current?.focus({ preventScroll: true })` を追加。Card 化は既存スタイル次第（Phase 5 で実体確認後決定、最小差分原則）。

---

## 2.4 `/loading.tsx`（検証）

### 設計

- 既に OKLch skeleton 実装済と想定。`bg-surface-2` 以外の色指定があれば置換
- `motion-safe:animate-pulse` が付いているか確認、付与漏れがあれば追加
- `role="status"` / `aria-busy` / `aria-live` の欠落があれば補完

検証のみで変更が不要な場合、Phase 5 の implementation-notes に「差分なし」と記録。

---

## 2.5 `/profile/loading.tsx`（編集）

### 現状

簡素な text のみ、skeleton 欠落。

### 設計

- root loading と統一: `role="status" aria-busy="true" aria-live="polite"` + `sr-only`
- Profile card layout を模した skeleton:
  - avatar（h-16 w-16 rounded-full）
  - 名前行（h-6 w-1/3）
  - KV ペア × 3（h-4 w-full）
- `bg-surface-2` + `motion-safe:animate-pulse`

### JSX 雛形

```tsx
export default function ProfileLoading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="mx-auto max-w-2xl space-y-4 px-6 py-12">
      <span className="sr-only">プロフィールを読み込み中</span>
      <div className="h-16 w-16 rounded-full bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-6 w-1/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-4 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
```

---

## 2.6 `/not-found.tsx`（検証）

現行 `apps/web/app/not-found.tsx` は UBM ロゴ画像ではなく、`data-page="not-found"`、404 表示、トップ / メンバー一覧への導線、`bg-accent text-panel` による brand CTA で最小ブランディングを成立させている。Phase 5 で以下を確認:

- `data-page="not-found"` / `data-testid="not-found"` が維持されている
- 「トップへ戻る」リンクが `bg-accent text-panel` の OKLch token utility で色付けされている
- 「メンバー一覧へ」リンクが `border-border` を使い、HEX 直書きがない
- HEX 直書きなし

変更不要なら verification log のみ。

---

## 2.7 共通設計要素

### focus 管理パターン

```tsx
const ref = useRef<HTMLHeadingElement>(null);
useEffect(() => {
  ref.current?.focus({ preventScroll: true });
}, [/* trigger deps */]);
```

`tabIndex={-1}` を `h1` に付与し、`outline` は token クラス（`focus-visible:outline-primary` 等）。

### aria 属性

| 用途 | 属性 |
|------|------|
| error 表示 | `role="alert" aria-live="assertive"` |
| loading 表示 | `role="status" aria-busy="true" aria-live="polite"` |
| sr-only テキスト | `<span className="sr-only">...</span>` |

### OKLch クラス対応表

| 用途 | クラス |
|------|--------|
| skeleton 背景 | `bg-surface-2` |
| エラー文字 | `text-danger` |
| primary CTA | `bg-accent text-panel` |
| code block 背景 | `bg-surface-2` |

すべて `apps/web/src/styles/tokens.css` 経由で OKLch 値に解決。HEX 直書きは禁止。

---

## 2.8 副作用 / 入出力

- 副作用: `console.error` でエラーログ、`headingRef.current?.focus()` で focus 移譲
- 入力: `error.tsx` は `{ error, reset }`、`loading.tsx` は引数なし
- 出力: ReactNode のみ

---

## 2.9 セキュリティ / プライバシー考慮

- `error.digest` は Cloudflare Workers ランタイムが付与する hash であり PII を含まない想定
- `console.error` 出力に PII を含めない（`error.message` のみ）
- `aria-live` でも `error.message` の生表示は避け、固定文言「ログイン処理でエラーが発生しました」を提示

---

## 2.10 次フェーズへの引き継ぎ

Phase 3 では:

- Card layout 適用範囲（login/error 必須、root/error 任意）の判断確定
- focus 管理が screen reader 体験を損なわないか（assertive announce との競合）の確認
- prefers-reduced-motion フォールバックの妥当性確認
