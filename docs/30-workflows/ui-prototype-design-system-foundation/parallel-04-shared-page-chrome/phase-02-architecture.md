---
phase: 2
title: アーキテクチャ設計 — Root chrome の構成と Server/Client 境界
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 2 — アーキテクチャ設計

[実装区分: 実装仕様書]

## 1. Root chrome のレイヤ構成

```
<html lang="ja" data-theme="warm">           ← Root layout (SC)
  <body>
    <ToastProvider>                          ← Client Component（Toast.tsx 由来）
      ┌──────────────────────────────────┐
      │ route group layout (SC, parallel-03) │
      │   ├─ (public)/layout.tsx              │
      │   ├─ (admin)/layout.tsx               │
      │   └─ (member)/layout.tsx              │
      │     └─ page.tsx (SC/CC, serial-05)    │
      │                                       │
      │ ── fallback 経路 ──                  │
      │   error.tsx (CC)   ← throw 時         │
      │   not-found.tsx (SC) ← notFound() / 404 │
      │   loading.tsx (SC)   ← Suspense       │
      └──────────────────────────────────┘
    </ToastProvider>
  </body>
</html>
```

凡例: SC = Server Component / CC = Client Component。

## 2. ファイルごとの責務と Server/Client 境界

| ファイル | 種別 | 必須 directive | 配置位置 | 主役割 |
|---------|------|----------------|---------|--------|
| `app/layout.tsx` | Server Component | なし（SC） | route tree の root | `<html>` `<body>` 生成 / css import / ToastProvider 配置 / metadata + viewport export |
| `app/error.tsx` | Client Component | `"use client"` 必須 | route tree の root | throw 捕捉 / `reset()` 再試行 / logger.error 構造化記録 |
| `app/not-found.tsx` | Server Component | なし（SC） | route tree の root | `notFound()` 呼び出し or 未マッチ URL 時の 404 fallback |
| `app/loading.tsx` | Server Component | なし（SC） | route tree の root | Suspense boundary が発火している間の global skeleton |

### 2.1 error.tsx が Client Component な理由

Next.js 15+ の規約:

- `error.tsx` は throw された Error を React の error boundary で捕捉するため、**必ず Client Component**（`"use client"` 冒頭付与）が要求される
- props は `{ error: Error & { digest?: string }; reset: () => void }` 固定（型は外部 import せず inline 定義可）
- `reset()` は React Error Boundary の reset を呼び出す Client side handler のため、Server Component では実装不可能

### 2.2 not-found.tsx / loading.tsx が Server Component な理由

- どちらも interactive state を持たないため Server Component で十分
- Server Component にすることで bundle size を最小化し、Cloudflare Workers の cold start を抑える
- `"use client"` を付けると不要に Client bundle に取り込まれるため明示的に付けない

## 3. css import 順序の不変条件

`apps/web/app/layout.tsx` の冒頭 import 順は次で固定する:

```ts
import "../src/styles/tokens.css";   // OKLch 変数定義（1 番目）
import "../src/styles/globals.css";  // Tailwind v4 bridge + @layer components（2 番目）
```

理由:

- `globals.css` は `var(--ubm-color-*)` を参照するため、`tokens.css` が先に評価される必要がある
- `globals.css` の `@layer components` で `body` 既定 selector を上書きする以上、`tokens.css` の `:root` 定義が先に解決されている必要がある
- 順序が逆だと build は通るが CSS cascade が壊れ、視覚的に「雰囲気」が出ない

## 4. data-theme cascade の起点

`<html data-theme="warm">` を root layout で固定することで:

- `tokens.css` の `[data-theme="warm"]` selector が画面全体に効く
- 将来 `data-theme="cool"` 等を追加する際も root 1 か所の切替で全画面に伝搬する
- route group / page で `data-theme` を上書きしない方針とする（衝突防止）

## 5. metadata / viewport export

Next.js 15 規約に従い 2 つを **個別に export** する（1 オブジェクトに混ぜない）。

```ts
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "UBM Hyogo", template: "%s | UBM Hyogo" },
  description: "UBM 兵庫支部会 メンバーサイト",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "oklch(0.99 0.01 95)", // tokens.css の surface-bg を文字列で複写（CI gate で許容される表現）
};
```

> `themeColor` は CSS variable 参照不可（meta tag に展開されるため）。token 値を文字列リテラルで複写する。`verify-design-tokens` gate は HEX 直書きを禁止するが OKLch 文字列リテラルは許容される。

## 6. ToastProvider 配置の不変条件

| 観点 | 規則 |
|------|------|
| 配置 | `<body>` の直下、`{children}` の親 1 か所のみ |
| 重複防止 | route group layout（parallel-03）からは ToastProvider を import しない |
| Client 境界 | ToastProvider 自身が Client Component（既存 `Toast.tsx:1` で `"use client"`）。root layout は SC のまま、Provider を JSX で組み込むだけで Server → Client 境界が確立される |
| `useToast()` 利用範囲 | 任意の子孫 Client Component から呼び出し可能。Server Component からは呼び出さない |

## 7. fallback 画面と既存 primitives の対応表

| ファイル | 派生する既存 primitive | 役割 | 派生方針 |
|---------|----------------------|------|---------|
| `error.tsx` | `Card` (`apps/web/src/components/ui/Card.tsx`) | ErrorCard | `<Card>` + `<CardHeader>` + `<CardContent>` で構成。タイトル color は `text-danger` トークン |
| `not-found.tsx` | `Card` + `EmptyState` (`apps/web/src/components/ui/EmptyState.tsx`) | NotFoundCard | `<EmptyState title description action>` を `<Card>` で囲む |
| `loading.tsx` | `Card` （`ui-card` skeleton 派生） | SkeletonCard + LoadingSpinner | `<Card>` 内部に `aria-busy` 付き skeleton 要素を配置 |

新規 primitive は作らない（NFR-04）。`<Card>` の `className` 拡張は許容するが、`ui-card-*` 系の CSS class は globals.css 側（parallel-01 担当）で定義されているものを使う。

## 8. hydration mismatch 防止

| リスク | 防止策 |
|-------|-------|
| `Date.now()` / `Math.random()` の SSR/CSR 差分 | root layout・not-found・loading では使わない |
| `localStorage` / `window` 参照 | error.tsx の `useEffect` 内のみ許可。SSR 側では参照しない |
| 翻訳 / locale 動的切替 | 本サブワークフローでは扱わない（`lang="ja"` 固定） |
| ToastProvider の SSR fallback | Toast 状態は Client only。`<div aria-live>` の初期 HTML を変えない |

## 9. 関連サブワークフローとのインターフェース

| 隣接 | 本サブワークフローからの provided | 受け取る前提 |
|------|--------------------------------|--------------|
| parallel-01-globals-css-rhythm | `body` に `data-theme` が必ず存在 | `@layer components` で `body` selector を定義 |
| parallel-02-prototype-css-rules-port | `<html data-theme="warm">` が起点 | selector ベース規則の cascade source |
| parallel-03-appshell-layouts | ToastProvider が祖先で配置済み | route group layout は `useToast()` を再 wrap しない |
| serial-05-page-routes-blueprint-binding | error/not-found/loading の global fallback が存在 | route 個別 fallback を上書き定義可能（ただし本サブワークフローでは作らない） |

## 10. 参照

- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-02-architecture.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md`
- Next.js 15 docs: app/layout.tsx / app/error.tsx / app/not-found.tsx / app/loading.tsx
- `apps/web/src/components/ui/Toast.tsx`
- `apps/web/src/components/ui/Card.tsx`
- `apps/web/src/components/ui/EmptyState.tsx`
- `apps/web/src/lib/logger.ts`
- `apps/web/src/styles/tokens.css`
- `apps/web/src/styles/globals.css`
