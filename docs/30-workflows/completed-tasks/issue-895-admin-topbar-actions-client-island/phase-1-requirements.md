# Phase 1 — 要件定義

## 1.1 背景

parallel-03-followup-001 で admin topbar は inline JSX から `AdminTopbar` primitive へ抽出され、`breadcrumb` / `actions` の 2 slot を持つ props 設計になった。`actions` slot は将来のグローバル操作ボタン群を受ける受け皿として用意されたが、followup-001 のスコープでは「topbar actions の具体ボタン実装は admin 機能側の別タスク」と明示的に deferred され、現状 `(admin)/layout.tsx` は `<AdminTopbar />`（props なし）で呼ばれ、actions slot は中身が空の `aria-hidden="true"` placeholder のままになっている。

## 1.2 課題

- 全 admin 画面共通の操作導線（ログアウト等）が topbar に集約されておらず、admin shell の上部右側が常に空白
- グローバル操作と各ページの `AdminPageHeader` actions（ページ固有操作）の責務境界が曖昧で、放置するとログアウト等のグローバル操作がページごとに重複実装されるリスク
- AdminTopbar 自体は Server Component で、actions に client 操作を入れる方法（呼び出し側で client island を作る）の実装サンプルが存在せず後続が迷う

## 1.3 目的

`AdminTopbar` の `actions` slot に、全 admin 画面共通のグローバル操作ボタン群を流し込む。`(admin)/layout.tsx`（Server Component）の境界を壊さず、操作ボタンは呼び出し側で作る小さな client island として `actions` props に渡す。MVP では既存導線（ログアウト）の集約を現実的なスコープとする。

## 1.4 機能要件

- FR-1: admin グローバル操作 client island component `AdminTopbarActions` を新規追加する（`"use client"`）
- FR-2: MVP では既存 `SignOutButton` を集約する（ログアウト導線）
- FR-3: `(admin)/layout.tsx` で `<AdminTopbar actions={<AdminTopbarActions />} />` 形式に置換する
- FR-4: AdminTopbar / `(admin)/layout.tsx` 自体は Server Component のまま維持する
- FR-5: 注入により AdminTopbar 内部 `data-component="admin-topbar-actions"` 要素の `aria-hidden` 属性が DOM から消える（placeholder 解除）
- FR-6: グローバル操作（topbar actions）とページ固有操作（AdminPageHeader actions）の責務境界を component コメント / spec に明記する

## 1.5 非機能要件

- NFR-1: axe critical violation 0 を維持
- NFR-2: 既存 `(admin)/layout.spec.tsx` / `AdminTopbar.spec.tsx` の data-* / slot 契約は **無修正で pass**
- NFR-3: `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning
- NFR-4: バンドルサイズへの実質的影響なし（既存 `SignOutButton` の再配置のみ）

## 1.6 制約（不変条件）

- INV-1: 新規 UI primitive を追加しない（CLAUDE.md UI prototype alignment 不変条件 3）。ボタンは既存 `apps/web/src/components/ui/Button.tsx` を流用
- INV-2: HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。色は `var(--ubm-color-*)` のみ（不変条件 2 / CI gate `verify-design-tokens`）
- INV-3: 新規 API endpoint 追加禁止 / D1 schema 変更禁止 / `apps/web` から D1 binding 直接アクセス禁止（不変条件 1, 4, 5）
- INV-4: AdminTopbar primitive 自体の props / DOM を変更しない（followup-001 で確定済みの slot 契約をそのまま使う）
- INV-5: `(admin)/layout.tsx` を client 化しない（認証ガード `getSession()` / `redirect()` は Server Component に閉じる、不変条件 #11 fail-closed）

## 1.7 スコープ

### 含むもの

- `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx`（新規 client island）
- `apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx`（新規 spec）
- `apps/web/app/(admin)/layout.tsx` の `<AdminTopbar />` → `<AdminTopbar actions={<AdminTopbarActions />} />` 差分

### 含まないもの

- AdminTopbar primitive 自体の変更
- 新規 UI primitive 追加
- 新規 API endpoint / D1 変更 / Google Form 変更
- 通知ベル等で既存 endpoint surface に存在しない API を必要とする操作（別タスク化）
- AdminPageHeader actions（ページ固有操作）の変更

## 1.8 受け入れ条件（DoD）

- AC-1: `AdminTopbarActions.tsx` が新規追加され、`"use client"` の island として MVP グローバル操作（ログアウト）を集約する
- AC-2: `(admin)/layout.tsx` が `<AdminTopbar actions={<AdminTopbarActions />} />` に置換され、AdminTopbar / layout.tsx いずれも client 化していない
- AC-3: 注入により AdminTopbar 内部 `data-component="admin-topbar-actions"` が `aria-hidden` を持たず、内部に accessible name 付き button を含む
- AC-4: topbar actions（グローバル）と AdminPageHeader actions（ページ固有）の責務境界が component コメント / spec に明記される
- AC-5: `AdminTopbarActions.spec.tsx` が新規追加され、ログアウト button 存在 / 責務境界 / トークン遵守を検証
- AC-6: 既存 `(admin)/layout.spec.tsx` / `AdminTopbar.spec.tsx` が無修正で pass
- AC-7: `pnpm typecheck` / `pnpm lint` が 0 error / 0 warning
- AC-8: axe critical violation 0 を維持
- AC-9: 新規 UI primitive を導入していない
- AC-10: HEX 直書き / arbitrary color class を導入していない
- AC-11: 新規 API endpoint / D1 直接アクセスを追加していない
