# Phase 1 — 要件定義サマリ

参照: `../../phase-01-requirements.md`

## スコープ
- `apps/web/app/(public)/layout.tsx`
- `apps/web/app/(admin)/layout.tsx`
- `apps/web/app/(member)/layout.tsx`
- 上記 3 layout の `*.spec.tsx`

## 主要 FR
- FR-01..03: 3 系統 layout の wrapper に `data-theme` / `data-route-group` / `data-shell` / `data-route` 契約を機械化
- FR-04: middleware / `getSession()` の既存 auth 経路を維持
- FR-05: primitive (`PublicHeader` / `PublicFooter` / `AdminSidebar` / `MemberHeader`) API 無改変
- FR-06: Admin layout に薄い `<header data-shell="topbar">` を追加 (ブレッドクラム slot + actions slot)
- FR-07: `min-h-screen` grid で viewport を占有

## NFR
- OKLch トークン正本、HEX/`bg-[#xxx]`/`text-[#xxx]` 禁止
- D1 直接アクセス禁止
- `*.spec.{ts,tsx}` only
- Server Component 既定、Client は `*.client.tsx`

## 受け入れ条件
1. build green
2. 3 layout に data-* 契約付与
3. typecheck / lint exit 0
4. layout spec green + axe 0 critical
5. middleware regression なし
