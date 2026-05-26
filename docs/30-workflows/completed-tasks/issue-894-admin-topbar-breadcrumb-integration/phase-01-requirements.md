# Phase 1: Requirements — issue-894 AdminTopbar breadcrumb 統合

## 1. Overview

Issue #894（2026-05-25 時点で CLOSED / `gh issue view 894` で確認）: AdminTopbar の `breadcrumb` slot（固定既定値「管理」）と page-local breadcrumb の二重構造を解消し、breadcrumb 責務の所有権を確定する。PR / commit 文脈は `Refs #894` のみを使う。

親 workflow `parallel-03-followup-001-admin-topbar-primitive-extraction` の Phase 12 にて明示的に deferred された「breadcrumb 実データ統合」を、本 workflow で完結させる。

## 2. Why（背景）

- `apps/web/app/(admin)/layout.tsx` line 36 で `<AdminTopbar />` が props なしで呼ばれ、`AdminTopbar` 内部の `breadcrumb ?? "管理"` 既定値（固定テキスト）が描画されている。
- 一方で `AdminPageHeader`（`apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx`）が各 admin page で breadcrumb を `Breadcrumb` primitive（`apps/web/src/components/admin/Breadcrumb.tsx`）経由で描画している。
- 現状コードで root breadcrumb 「管理」を page-local に持っていた admin consumer は **8 ページ**:
  - `apps/web/app/(admin)/admin/page.tsx`: `breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "ダッシュボード" }]}`
  - `apps/web/app/(admin)/admin/members/page.tsx`: `breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "会員管理" }]}`
  - `apps/web/app/(admin)/admin/requests/page.tsx`
  - `apps/web/app/(admin)/admin/tags/page.tsx`
  - `apps/web/app/(admin)/admin/schema/page.tsx`
  - `apps/web/app/(admin)/admin/audit/page.tsx`
  - `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`
  - `apps/web/app/(admin)/admin/meetings/page.tsx`
- 「管理」ラベルが topbar slot と page-local breadcrumb 先頭の双方に現れる **二重表示** が発生。
- topbar slot は固定テキスト直書きのまま primitive 経由になっておらず、design token / a11y 監査の primitive 一網打尽な grep 運用と整合しない。

## 3. What（達成すること）

- topbar の breadcrumb slot を **既存 `Breadcrumb` primitive 経由** に統一する（案 B 採用 / Phase 2 参照）。
- topbar slot = ルートトップ静的ラベル「管理」、AdminPageHeader = ページ内現在地のみ、と役割分担を確定する。
- 既存 `(admin)/layout.tsx` を **server component のまま** 維持（`usePathname` 等 client API 持ち込み禁止）。
- 各 admin page-local breadcrumb から先頭の `{ label: "管理", href: "/admin" }` を除去し、「管理」ラベルの重複を解消する。

## 4. 不変条件（CLAUDE.md より継承）

| ID | 内容 | 本タスクへの適用 |
|----|------|------------------|
| 不変条件1 | 既存 API のみ接続 | API endpoint 追加・変更なし |
| 不変条件2 | OKLch トークン正本化（HEX 直書き禁止） | `Breadcrumb` の既存 `ui-breadcrumb` class / token 参照のみ |
| 不変条件3 | プロトタイプ正本順位（新規 primitive 禁止） | 既存 `Breadcrumb.tsx` を再利用 |
| 不変条件4 | D1 直接アクセス禁止 | `apps/web` から D1 binding 触らない |
| RSC 維持 | `(admin)/layout.tsx` を server component のまま | `usePathname` / `"use client"` 持ち込み禁止 |

## 5. ステークホルダー

- 主担当: `daishiman`（solo dev）
- 影響範囲: admin 全画面の topbar 表示 / page-local breadcrumb consumer 8 ページ
- レビュアー: solo dev 運用ポリシーにより必須レビュアー 0 / CI gate のみ

## 6. 受け入れ条件サマリ（詳細は phase-08-dod.md）

- AC-1: breadcrumb 責務所有権を Phase 2 で明文化（案 B 採用）
- AC-2: topbar breadcrumb slot が primitive 経由
- AC-3: 「管理」ラベルが topbar / AdminPageHeader で二重表示されない
- AC-4: 新規 primitive を追加していない
- AC-5: `(admin)/layout.spec.tsx` の data-* 契約が pass
- AC-6: layout が server component のまま
- AC-7: `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning
- AC-8: axe critical violation 0 維持
- AC-9: HEX 直書き / arbitrary value なし
- AC-10: API endpoint / D1 schema / Google Form 仕様の変更なし

## 7. スコープ外

- topbar `actions` slot の具体ボタン実装
- AdminPageHeader 未導入ページ（tags / meetings / schema / requests / identity-conflicts / audit）への AdminPageHeader 導入（page-local Breadcrumb の root label 除去のみ対象）
- design token の改変
- Google Form 仕様変更
