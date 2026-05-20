# UT-DSF-03: parallel-04 Root chrome / Global fallback 画面実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-DSF-03 |
| タスク名 | parallel-04 Root chrome (layout/error/not-found/loading) 共通 fallback 実装 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-05-19 |
| 既存タスク組み込み | あり |
| 組み込み先 | ui-prototype-design-system-foundation / parallel-04-shared-page-chrome |

## 目的

全 route group の上位 root 層に位置する 4 ファイル（`app/layout.tsx` / `app/error.tsx` /
`app/not-found.tsx` / `app/loading.tsx`）を、プロトタイプの primitives + tokens + rhythm に
揃えた状態に編集する。`<html data-theme="warm">` の cascade 起点を確定させ、ToastProvider /
tokens.css / globals.css の import 順を正規化し、error / not-found / loading の各 fallback を
既存 `Card` / `EmptyState` / `Spinner` 派生で構成する。

## スコープ

### 含む

- `apps/web/app/layout.tsx` 編集: `<html lang="ja" data-theme="warm">` / tokens.css → globals.css の
  import 順 / ToastProvider を `<body>` 直下配置 / `metadata` / `viewport` の Next.js 15 規約準拠
- `apps/web/app/error.tsx` 編集: `"use client"` + `{ error, reset }` props / `ErrorCard`（既存 Card 派生）
  / `reset()` + 「トップへ戻る」リンク / `logger` 経由の構造化ログ出力
- `apps/web/app/not-found.tsx` 編集: Server Component / `NotFoundCard`（既存 Card 派生）の 404 表示
- `apps/web/app/loading.tsx` 編集: Server Component / `LoadingSpinner` + `SkeletonCard`（既存 primitives 派生）
- 4 ファイル全体で OKLch トークン経由のみ、HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件
- `*.spec.tsx`（React Testing Library）の追加

### 含まない

- 新規 primitive 追加（Card / EmptyState / Toast / Spinner の既存 primitives を派生で再構成）
- 3 つの route group layout（UT-DSF-02 の責務）
- ToastProvider 本体実装（既存）の改修
- logger 本体実装の改修

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | UT-DSF-01（parallel-01 globals.css） | `[data-theme]` cascade selector が globals に存在する前提 |
| 並列 | UT-DSF-02（parallel-03 AppShell layouts） | root が `<html data-theme>` を、route group が `data-shell` / `data-route` を担う分担 |
| 下流 | UT-DSF-04（serial-05 page routes binding） | 19 routes の page.tsx が root chrome + AppShell + page-level rhythm の合流地点で描画される |
| 下流 | UT-DSF-06（serial-07 regression evidence） | error / not-found / loading の screenshot 取得対象になる可能性 |

## 苦戦箇所・知見

**プロトタイプ未掲載画面（error / not-found / loading）への primitives 揃え**: `09h-shell-and-fixtures.md`
の fallback section は記載があるが、プロトタイプ JSX には完成形が無い。既存 `Card` / `EmptyState` / `Spinner`
の派生として「新規 primitive を生やさず」に組み立てること。新規 primitive を作ると `verify-primitive-adoption`
gate（task-749）に抵触する可能性。

**`data-theme` cascade の二重設定リスク**: `<html data-theme="warm">` を root で設定後、`(admin)` route group が
`data-theme="cool"` で上書きする。route group layout 側の `data-theme` を `<body>` ではなく内側の wrapper
element に置き、root `<html>` 側を変更しない設計とする（UT-DSF-02 側で対応）。

**Toast Provider の二重ラップ防止**: root layout で 1 度だけ `<ToastProvider>` をラップする。route group
layout からは `<ToastProvider>` を import しない（NFR-04）。

**hydration mismatch**: root layout で `Date.now()` / `Math.random()` / `useLayoutEffect` 等を使わない。
SSR と CSR の最初の HTML を完全一致させる。

**Next.js 16 + `@opennextjs/cloudflare` 互換**: `viewport` export は Next.js 15+ の API。Workers ランタイムで
edge runtime 指定をしない（既存挙動を維持）。

**`"use client"` directive の境界**: `app/error.tsx` は client、それ以外の 3 ファイル（layout / not-found / loading）
は Server Component。`logger` は server-only にすると error.tsx から呼べないため、universal logger を使うか
client-safe な error reporter ラッパーに包む。

**HEX 直書き grep gate**: `bg-[#xxx]` / `text-[#xxx]` / 6桁 HEX が 1 つでも残ると `verify-design-tokens` が fail。
既存 4 ファイルに drift がないか着手前に grep を取る。

## 受け入れ基準

- [ ] `<html lang="ja" data-theme="warm">` が root layout で設定済み
- [ ] tokens.css → globals.css の import 順が正規化済み
- [ ] ToastProvider が `<body>` 直下に 1 箇所だけ配置
- [ ] `metadata` / `viewport` が Next.js 15 規約で export
- [ ] error.tsx が `"use client"` + `{ error, reset }` props + reset + トップへ戻るリンク + logger 連携
- [ ] not-found.tsx / loading.tsx が Server Component で動作
- [ ] 4 ファイルで HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件
- [ ] 新規 primitive 追加 0 件
- [ ] `pnpm typecheck` / `pnpm lint` / `next build --webpack` が exit 0
- [ ] Phase 11 evidence（screenshot 4 状態: 通常 / error / not-found / loading）取得済み

## 参照

正本仕様（Phase 1-13）:

- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-02-architecture.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-03-task-breakdown.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-04-contracts.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-05-implementation-guide.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-06-test-strategy.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-07-quality-gates.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-08-definition-of-done.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-09-risks.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-10-local-verification.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-12-compliance-check.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/phase-13-commit-pr-draft.md`

参考:

- `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`
- `apps/web/app/{layout,error,not-found,loading}.tsx`（既存）
- `apps/web/src/components/ui/`（既存 primitives）
