# Phase 2: 設計

## 1. 既存実装確認

| 確認項目 | コマンド | 期待値 |
|---|---|---|
| 対象ファイル現状 | `cat apps/web/app/profile/loading.tsx` | 簡素な `<p aria-live="polite">読み込み中…</p>` 実装 |
| OKLch token 存在 | `grep -n "surface-bg-2\|surface-2" apps/web/src/styles/tokens.css apps/web/src/styles/globals.css` | `--ubm-color-surface-bg-2` / `--color-surface-2: var(--ubm-color-surface-bg-2);` |
| Tailwind config | `cat apps/web/tailwind.config.ts` | Tailwind v4 構成。utility は `@theme inline` 経由で自動生成 |
| Vitest 設定 | `cat apps/web/vitest.config.ts` | DOM 環境（jsdom or happy-dom）が設定済みであること |
| React 型 | `grep ReactElement apps/web/app/login/error.tsx 2>/dev/null` | `ReactElement` import がプロジェクトで使用例あり |

## 2. 設計方針

- **Server Component で実装**: `"use client"` directive を付けず、Next.js が SSR fallback として直接 stream する。
- **token 経由のみ**: 色は `bg-surface-2` utility のみ使用。`bg-[#xxx]` / HEX 直書き禁止（task-18 gate 通過）。
- **motion-safe**: `motion-safe:animate-pulse` で `prefers-reduced-motion: reduce` 環境では animation 停止。
- **CLS 最小化**: 実 `/profile` page と同じ `max-w-3xl px-6 py-12` container を採用。
- **a11y 一貫性**: i01-i06 と同じ「`role="status"` + `aria-busy` + `aria-live="polite"` + `.sr-only` 補助テキスト」3点セット。

## 3. ファイル設計

### 3.1 `apps/web/app/profile/loading.tsx`（修正後の最終形）

```tsx
import type { ReactElement } from "react";

export default function ProfileLoading(): ReactElement {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-3xl space-y-6 px-6 py-12"
      data-page="profile-loading"
    >
      <span className="sr-only">マイページを読み込み中</span>
      {/* avatar + heading row */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-8 w-48 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
      {/* KV pair rows */}
      <div className="space-y-3">
        <div className="h-6 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-5/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-4/6 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-6 w-3/6 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
    </main>
  );
}
```

### 3.2 `apps/web/app/profile/loading.spec.tsx`（新規）

Phase 4 にて TC を確定し、テスト本体を貼り付ける。検証観点:
- `role="status"` を持つ
- `aria-busy="true"` / `aria-live="polite"` を持つ
- `.sr-only` テキスト「マイページを読み込み中」が存在する
- `data-page="profile-loading"` が root に付与されている

## 4. 関数シグネチャ

```ts
export default function ProfileLoading(): ReactElement;
```

引数なし / props なし（Next.js App Router の loading.tsx 規約に従う）。

## 5. 入出力・副作用

| 時点 | 動作 |
|---|---|
| `/profile` route streaming 中 | skeleton 表示 + `.sr-only` テキストで screen reader にアナウンス |
| streaming 完了 | Next.js が `apps/web/app/profile/page.tsx` の本体に差し替え（本タスクの責務外） |
| `prefers-reduced-motion: reduce` 環境 | `motion-safe:animate-pulse` により pulse 停止、static skeleton として表示 |

副作用なし（純粋な UI render）。

## 6. 既存パターンとの整合

| パターン | 出典 | 適用箇所 |
|---|---|---|
| `role="status"` + `aria-busy` + `aria-live="polite"` | parallel-07 / i05 (LoginLoading) | root `<main>` |
| `.sr-only` 補助テキスト | parallel-07 / i05 | 「マイページを読み込み中」 |
| `bg-surface-2 motion-safe:animate-pulse` | i01-i06 | 全 placeholder block |
| `data-page` attribute | E2E 識別子規約 | `data-page="profile-loading"` |

## 7. 不変条件チェック（CLAUDE.md）

| 不変条件 | 適用 |
|---|---|
| #1 schema 固定しすぎない | 該当なし（UI のみ） |
| #2 consent キー | 該当なし |
| #5 D1 直接アクセス禁止 | 該当なし（DB アクセスなし） |
| OKLch トークン正本化 | `bg-surface-2` utility のみ使用、HEX 禁止 |
| プロトタイプ正本順位 | parallel-07 spec §4.5 に従う（新規 primitive 生やさない） |
