---
phase: 3
title: タスク分解 — 3 layout を独立 step で実装
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 3 — タスク分解

[実装区分: 実装仕様書]

## 1. 分解原則

Clean Code SRP に従い「1 step = 1 layout の編集 + その spec」とする。3 step は相互に独立で並列可能（同一ファイルを触らない）。Phase 4 で各 step の入出力契約を確定し、Phase 5 で実装ガイドを与える。

## 2. Step 一覧

| Step | 責務 | 編集ファイル | 追加 spec | 依存 |
|------|------|--------------|-----------|------|
| S-01 | Public AppShell に `data-theme` / `data-shell` / `data-route` 契約を導入 | `apps/web/app/(public)/layout.tsx` | `apps/web/app/(public)/layout.spec.tsx` | parallel-01, parallel-02（selector が globals.css に存在すること） |
| S-02 | Admin AppShell に `data-theme="cool"` + topbar 行 + `data-shell="sidebar/topbar"` 契約を導入。既存 `getSession()` gate を維持 | `apps/web/app/(admin)/layout.tsx` | `apps/web/app/(admin)/layout.spec.tsx` | parallel-01, parallel-02 |
| S-03 | Member AppShell に `data-theme="warm"` + `data-shell="topbar"` + `data-route="member"` 契約を導入 | `apps/web/app/(member)/layout.tsx` | `apps/web/app/(member)/layout.spec.tsx` | parallel-01, parallel-02 |

## 3. Step ごとの詳細チェックリスト

### S-01 Public AppShell

- [ ] `apps/web/app/(public)/layout.tsx` を編集
- [ ] route group 直下に `<div data-theme="warm" data-route-group="public" data-testid="public-shell">` を配置
- [ ] `<header data-shell="topbar"><PublicHeader /></header>` で wrap
- [ ] `<main data-route="public">{children}</main>` で wrap
- [ ] `<footer data-shell="footer"><PublicFooter /></footer>` で wrap
- [ ] `className="min-h-screen grid grid-rows-[auto_1fr_auto]"` を `<div>` に付与
- [ ] OKLch トークン以外の色 utility が無いこと（grep `bg-\[#`）
- [ ] spec: render 後に `data-testid="public-shell"` / `[data-shell="topbar"]` / `[data-route="public"]` / `[data-shell="footer"]` が DOM に存在することを assertion
- [ ] spec: axe-core で critical 違反 0

### S-02 Admin AppShell

- [ ] `apps/web/app/(admin)/layout.tsx` を編集
- [ ] `getSession()` → 未認証 / non-admin redirect の既存契約を維持
- [ ] route group 直下に `<div data-theme="cool" data-route-group="admin" data-testid="admin-shell">` を配置
- [ ] grid: `grid-cols-[240px_1fr] grid-rows-[auto_1fr]`
- [ ] `<aside data-shell="sidebar" className="md:row-span-2">` 内に `<AdminSidebar />`
- [ ] `<header data-shell="topbar">` 内に inline topbar JSX（現在地 label + actions slot placeholder）
- [ ] `<main data-route="admin">{children}</main>`
- [ ] OKLch トークン経由のみ
- [ ] spec: 未認証 → redirect 呼び出し、admin 認証 → render を assertion（`getSession` mock）
- [ ] spec: render 後 `[data-shell="sidebar"]` / `[data-shell="topbar"]` / `[data-route="admin"]` 存在を assertion

### S-03 Member AppShell

- [ ] `apps/web/app/(member)/layout.tsx` を編集
- [ ] route group 直下に `<div data-theme="warm" data-route-group="member" data-testid="member-shell">` を配置（既存 `data-testid="member-shell"` は維持）
- [ ] `className="min-h-screen grid grid-rows-[auto_1fr]"`
- [ ] `<header data-shell="topbar"><MemberHeader /></header>`
- [ ] `<main data-route="member">{children}</main>`
- [ ] `member-shell` / `member-main` の独自 class は data-* 契約に統一して削除
- [ ] auth gate は層 2 の責務とせず layout では一切実行しない
- [ ] spec: render 後 `[data-shell="topbar"]` / `[data-route="member"]` 存在を assertion

## 4. 並列実行条件

3 step は独立ファイルを編集するため並列可能。共通 dependency は parallel-01 / parallel-02 の globals.css 規則のみで、本サブワークフロー内では衝突しない。

## 5. 完了判定

- 3 step 全てが Phase 4-10 の DoD を満たす
- `pnpm typecheck && pnpm lint` exit 0
- 3 layout の spec が green
- 既存 spec（`(admin)/layout.spec.tsx` 等が既に存在する場合は）regression 0

## 6. 進捗フォーマット

各 step は実装完了時に以下を Phase 11 evidence inventory に記録する:

- diff の `git diff --stat`
- 該当 spec の実行ログ（`pnpm --filter @ubm-hyogo/web test -- (public)/layout.spec.tsx` 等）
- Playwright visual harness の url（serial-07 で取得する screen 名のみ control）
