---
phase: 1
title: 要件定義 — Root chrome / Global fallback 画面（layout / error / not-found / loading）
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 1. 本サブワークフローの位置づけ

`docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md` の DoD 2「root `app/layout.tsx` + 共通 chrome 派生 fallback」に対応する。

`parallel-03-appshell-layouts` が route group ごとの AppShell（`(public)` / `(admin)` / `(member)`）を扱うのに対し、本サブワークフローは **全 route group の上位** に位置する root 層を担当する。具体的には:

- `apps/web/app/layout.tsx` — 全画面共通の `<html>` / `<body>` / ToastProvider / global css import
- `apps/web/app/error.tsx` — Client Component の global error boundary
- `apps/web/app/not-found.tsx` — Server Component の 404 fallback
- `apps/web/app/loading.tsx` — Suspense fallback（global デフォルト）

> **既存ファイルの扱い**: 上記 4 ファイルは `apps/web/app/` 配下に既存実装が存在する（git status で tracked）。本サブワークフローは **新規作成ではなく既存ファイルの編集（仕様準拠化）** として扱う。

## 2. 解決すべき要件

### 2.1 機能要件

| ID | 要件 | 対象ファイル |
|----|------|------------|
| FR-01 | `<html lang="ja" data-theme="warm">` を root layout で設定する（`data-theme` cascade の起点） | `app/layout.tsx` |
| FR-02 | `apps/web/src/styles/tokens.css` → `apps/web/src/styles/globals.css` の順で import する | `app/layout.tsx` |
| FR-03 | ToastProvider を `<body>` 直下に配置し、全 route group から `useToast()` を利用可能にする | `app/layout.tsx` |
| FR-04 | `metadata` と `viewport` を Next.js 15 規約に沿って export する | `app/layout.tsx` |
| FR-05 | error.tsx は `"use client"` directive を冒頭に持ち、`{ error, reset }` props を受ける | `app/error.tsx` |
| FR-06 | error.tsx は `ErrorCard`（既存 Card primitive 派生）で構成し、`reset` 呼び出しと「トップへ戻る」リンクを提供する | `app/error.tsx` |
| FR-07 | not-found.tsx は Server Component とし、`NotFoundCard`（既存 Card primitive 派生）で 404 表示 | `app/not-found.tsx` |
| FR-08 | loading.tsx は Server Component とし、`LoadingSpinner` / `SkeletonCard`（既存 primitives 派生）で fallback 表示 | `app/loading.tsx` |
| FR-09 | 4 ファイルすべて OKLch トークン経由で表現し、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を含まない | 4 ファイル全体 |
| FR-10 | logger（`apps/web/src/lib/logger.ts`）経由で error boundary 発火を構造化ログに出力する | `app/error.tsx` |

### 2.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | OKLch トークン正本性を維持する（HEX 直書き禁止） |
| NFR-02 | hydration mismatch を発生させない（root layout で `Date.now()` / `Math.random()` 等の SSR/CSR 差分を使わない） |
| NFR-03 | error.tsx 以外の 3 ファイルは Server Component として動作する（`"use client"` を付けない） |
| NFR-04 | ToastProvider が二重ラップにならない（route group layout からは ToastProvider を import しない） |
| NFR-05 | Next.js 16 + `@opennextjs/cloudflare` の Workers ランタイムで動作する |
| NFR-06 | `pnpm typecheck` / `pnpm lint` / `pnpm build`（`next build --webpack`）が green |
| NFR-07 | テスト suffix は `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` 禁止） |

### 2.3 ステークホルダー観点（要件レビュー）

| 系統 | 観点 |
|------|------|
| システム系 | root 層 4 ファイルは全 route group の祖先。ここで `data-theme` / ToastProvider / css import を確定させないと、page-level rhythm が全画面に届かない |
| 戦略・価値系 | 4 ファイル中 1 つでも fallback が崩れるとユーザーは「壊れた画面」を見続けることになる。error / not-found / loading は雰囲気のラストガード |
| 問題解決系 | 真の論点は「fallback 画面がプロトタイプの primitives と乖離していないこと」。新規 primitive を生やさず、既存 Card / EmptyState / Spinner で組み立てる |

## 3. 不変条件

CLAUDE.md「UI prototype alignment / MVP recovery」セクションを継承する。

1. 既存 API endpoint surface のみ接続（本サブワークフローは API を呼ばないため自動的に満たす）
2. OKLch トークン正本化（HEX 直書き禁止）
3. プロトタイプ正本順位（**新規 primitive を生やさない**。既存 Card / EmptyState / Toast を派生で再構成する）
4. D1 直接アクセス禁止（本サブワークフローは DB を触らないため自動的に満たす）

## 4. スコープ境界

### IN

- `apps/web/app/layout.tsx` の編集（既存）
- `apps/web/app/error.tsx` の編集（既存）
- `apps/web/app/not-found.tsx` の編集（既存）
- `apps/web/app/loading.tsx` の編集（既存）
- 既存 primitives（`apps/web/src/components/ui/Card.tsx`, `EmptyState.tsx`, `Toast.tsx` 等）の use site 追加（API 変更なし）

### OUT

- route group 配下の layout.tsx（parallel-03 担当）
- `app/(public)/members/[id]/not-found.tsx` 等の route-scoped fallback（serial-05 で route 個別に扱う）
- `apps/web/src/components/ui/` 配下の primitive API 変更・新規追加
- globals.css の `@layer components` 拡張（parallel-01 担当）
- selector 規則の追加（parallel-02 担当）
- Playwright visual evidence の取得（serial-07 担当）

## 5. 既存ファイル現況サマリ（Read 結果）

| ファイル | 現状 | 主な差分 |
|---------|------|---------|
| `apps/web/app/layout.tsx` | 既存 19 行。`metadata` あり / `viewport` なし / `<html lang="ja">` のみで `data-theme` なし / `tokens.css` import なし | FR-01 / FR-02 / FR-04 を満たすため編集要 |
| `apps/web/app/error.tsx` | 既存 58 行。`"use client"` あり / props 契約適合 / logger 連携あり / Tailwind utility で構成 | FR-06 を満たすため Card primitive 派生に再構成 |
| `apps/web/app/not-found.tsx` | 既存 34 行。Tailwind utility で構成 | FR-07 を満たすため Card primitive 派生に再構成 |
| `apps/web/app/loading.tsx` | 既存 17 行。skeleton を utility で表現 | FR-08 を満たすため SkeletonCard / Spinner 派生に再構成 |

## 6. 受け入れ条件

1. 4 ファイル編集後、`pnpm typecheck` / `pnpm lint` / `pnpm build`（webpack）が green
2. root layout に `<html lang="ja" data-theme="warm">` が存在し、`tokens.css` → `globals.css` の順で import されている
3. ToastProvider が `<body>` 直下に 1 度だけ配置されている
4. error.tsx の props 型が `{ error: Error & { digest?: string }; reset: () => void }` で受けている
5. 4 ファイル全体に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が含まれない（`verify-design-tokens` gate に整合）
6. テスト追加分は `*.spec.tsx` のみ

## 7. 参照

- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-02-architecture.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md`（ToastProvider 配置要件）
- `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`
- `docs/00-getting-started-manual/claude-design-prototype/app.jsx`
- `apps/web/src/components/ui/Toast.tsx`
- `apps/web/src/components/ui/Card.tsx`
- `apps/web/src/components/ui/EmptyState.tsx`
- `apps/web/src/styles/tokens.css`
- `apps/web/src/styles/globals.css`
- `apps/web/app/layout.tsx`
- `apps/web/app/error.tsx`
- `apps/web/app/not-found.tsx`
- `apps/web/app/loading.tsx`
