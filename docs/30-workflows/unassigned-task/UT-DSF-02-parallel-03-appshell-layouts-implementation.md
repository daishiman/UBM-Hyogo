# UT-DSF-02: parallel-03 AppShell layouts（公開 / 管理 / 会員）共通 chrome 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-DSF-02 |
| タスク名 | parallel-03 3 系統 AppShell layout 共通 chrome 実装 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-05-19 |
| 既存タスク組み込み | あり |
| 組み込み先 | ui-prototype-design-system-foundation / parallel-03-appshell-layouts |

## 目的

`apps/web/app/` 配下の 3 系統 route group layout
（`(public)/layout.tsx` / `(admin)/layout.tsx` / `(member)/layout.tsx`）に、
UT-DSF-01 / parallel-02 で `globals.css` に追加した
`data-theme` / `data-shell` / `data-route` selector が機械的に当たる共通 chrome 規約を実装する。

既存 layout の編集として扱い、新規 layout を作らない / 既存 primitives の props を変更しない。

## スコープ

### 含む

- `apps/web/app/(public)/layout.tsx` 編集: `data-theme="warm"` /
  `<header data-shell="topbar">` / `<main data-route="public">` / `<footer data-shell="footer">` を満たす
- `apps/web/app/(admin)/layout.tsx` 編集: `data-theme="cool"` / `<aside data-shell="sidebar">` /
  `<header data-shell="topbar">`（追加）/ `<main data-route="admin">` を満たす
- `apps/web/app/(member)/layout.tsx` 編集: `data-theme="warm"` / `<header data-shell="topbar">` /
  `<main data-route="member">` を満たす（現行 `/profile` / `/login` は root 配下のまま）
- 3 layout の `*.spec.tsx`（React Testing Library + axe）追加
- 既存 `middleware.ts` / `getSession()` 既存 auth 経路の維持
- Admin layout への AdminTopbar 相当（ブレッドクラム + サインアウト導線）追加

### 含まない

- root `app/layout.tsx`（UT-DSF-03 の責務）
- `app/error.tsx` / `app/not-found.tsx` / `app/loading.tsx`（UT-DSF-03）
- 新規 primitive 追加 / 既存 primitives（`PublicHeader` / `PublicFooter` / `AdminSidebar` / `MemberHeader`）の props 変更
- middleware / auth ロジックの改修
- `(member)` route group への `/profile` / `/login` 物理移送

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | UT-DSF-01（parallel-01 globals.css） | data-shell / data-route / data-theme selector が cascade で利く前提 |
| 並列 | UT-DSF-03（parallel-04 root chrome） | data-theme cascade の起点（`<html>`）を担うため両方が揃って初めて雰囲気が継承される |
| 下流 | UT-DSF-04（serial-05 page routes binding） | 各 page.tsx が AppShell 配下で blueprint 反映される |

## 苦戦箇所・知見

**3 layout の `data-*` 契約整合**: `data-theme` / `data-shell` / `data-route` の 3 つは UT-DSF-01 で
定義した CSS selector と 1 文字でも違えば silent fail する。public/admin/member の 3 layout で
typo を起こさないよう、Phase 6 spec の DOM scrape で `[data-route="public"]` 等の attribute 存在を assert する。

**Admin Topbar / Sidebar の SignOutButton 重複**: 既存 `AdminSidebar` 内の `SignOutButton` と、新規追加する
`AdminTopbar` 相当のサインアウト導線が重複する可能性。Phase 2 で「Topbar 側に集約 / Sidebar 側を残す」を
確定する。既存 primitive の props を変えない制約から、wrapper 側で hide する分岐に倒すのが安全。

**Server Component 既定 vs Client Component 境界**: layout は Server Component が既定。`getSession()`（既存）も
Server 側。`SignOutButton` 等の Client Component は `.client.tsx` boundary を超えて props を渡せるため、
不要な `"use client"` を layout に付けない。

**(member) route group の vestigial 状態**: `app/(member)/layout.tsx` は children を持たない vestigial 状態
（root 配下 `/profile` `/login` が実体）。SCOPE.md / PROTOTYPE-COVERAGE.md の `current_app_path` 優先方針に
従い、現行 path を維持。**`(member)` への物理移送は本タスクで行わない**。

**既存 primitives の API 変更禁止**: `PublicHeader` / `PublicFooter` / `AdminSidebar` / `MemberHeader` の
import パス / props を変更しない。`data-*` 属性は wrapper element 側で付与する。

**Cloudflare Workers ランタイム制約**: `next build --webpack`（OpenNext Workers 互換）で build green を維持する。
SSR で Node-only API を呼ばないこと。

## 受け入れ基準

- [ ] `(public)/layout.tsx` が `data-theme="warm"` / `data-shell="topbar"` / `data-route="public"` / `data-shell="footer"` を満たす
- [ ] `(admin)/layout.tsx` が `data-theme="cool"` / `data-shell="sidebar"` / `data-shell="topbar"` / `data-route="admin"` を満たす
- [ ] `(member)/layout.tsx` が `data-theme="warm"` / `data-shell="topbar"` / `data-route="member"` を満たす
- [ ] 既存 primitives の props / import パスが diff 0
- [ ] middleware / getSession の auth 経路が diff 0
- [ ] 3 layout の `*.spec.tsx` が React Testing Library + axe で green
- [ ] `pnpm typecheck` / `pnpm lint` / `next build --webpack` が exit 0
- [ ] Phase 11 evidence（DOM scrape / screenshot）取得済み

## 参照

正本仕様（Phase 1-13）:

- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-02-architecture.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-03-task-breakdown.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-04-interface-contract.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-05-implementation-guide.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-06-test-strategy.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-07-quality-gates.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-08-dod.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-09-risks.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-10-local-verification.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-12-compliance-check.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-13-commit-pr.md`

参考:

- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
- `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`
- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
