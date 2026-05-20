---
phase: 1
title: 要件定義 — 3 系統 AppShell layout 共通 chrome の確立
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 1. 解決すべき要件

`apps/web/app/` 配下の **3 系統 AppShell layout**（公開・管理・会員）に、parallel-01/02 で globals.css に追加した `[data-theme]` / `[data-shell]` / `[data-route]` selector を機械的に当てるための共通 chrome 規約を実装する。

### 1.1 機能要件

| ID | 要件 | 根拠 |
|----|------|------|
| FR-01 | `apps/web/app/(public)/layout.tsx` を編集し、Public AppShell として `data-theme="warm"` / `<header data-shell="topbar">` / `<main data-route="public">` / `<footer data-shell="footer">` の 4 hook を満たす | 09e blueprint L20-L66、09h shell-and-fixtures §1 |
| FR-02 | `apps/web/app/(admin)/layout.tsx` を編集し、Admin AppShell として `data-theme="cool"` / `<aside data-shell="sidebar">` / `<header data-shell="topbar">`（追加）/ `<main data-route="admin">` を満たす | 09g blueprint L4-L161、09h shell-and-fixtures §2 |
| FR-03 | `apps/web/app/(member)/layout.tsx` を編集し、将来の Member AppShell として `data-theme="warm"` / `<header data-shell="topbar">` / `<main data-route="member">` を満たす。本 layout は将来の member-only routes 用であり、現行 `/profile` と `/login` は root 配下の既存 path を維持する（SRP / 認証境界判断は serial-00 phase-02 §3.1 補足を参照） | 09f blueprint L30-L110、09h shell-and-fixtures §3、serial-00 phase-02 §3.1 |
| FR-04 | 3 layout は Server Component を既定とし、認証 / role gate は既存 `apps/web/middleware.ts`（公開/管理 redirect）と既存 layout 内 `getSession()`（管理 isAdmin gate）を維持する。新規 auth 実装は行わない | middleware.ts 既存契約 / 09h §4 |
| FR-05 | 既存 primitive `PublicHeader` / `PublicFooter` / `AdminSidebar` / `MemberHeader` の **import パスと props を変更せず**、layout 側で wrapper element に `data-*` 属性を付与する形で migrate する | NFR-04（既存 primitives の API 変更禁止） |
| FR-06 | Admin layout に AdminTopbar 相当の薄い `<header data-shell="topbar">`（ブレッドクラム + サインアウト導線）を追加する。`AdminSidebar` 内の `SignOutButton` は重複を避けるため Topbar 側へ移動するか、両方残すかを Phase 2 で確定する | 09g blueprint L24-L60、parallel-08 spec §3 |
| FR-07 | 3 layout は `min-h-screen` / `grid` レイアウトで AppShell 高さ全体を埋め、`<main>` が viewport の残余領域を占有する | 09h shell-and-fixtures §1.3 |

### 1.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | OKLch トークン正本性を維持。`bg-[var(--ubm-color-*)]` 経由のみ。HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止 |
| NFR-02 | `apps/web` から D1 binding 直接アクセス禁止（layout でも遵守） |
| NFR-03 | 既存 API endpoint surface のみ接続（session 取得は既存 `getSession()` のみ） |
| NFR-04 | 既存 primitives（`PublicHeader` / `PublicFooter` / `AdminSidebar` / `MemberHeader`）の props / 関数シグネチャを変更しない |
| NFR-05 | Cloudflare Workers 互換 build (`next build --webpack`) が green |
| NFR-06 | `pnpm typecheck` / `pnpm lint` が exit 0 |
| NFR-07 | テスト suffix は `*.spec.{ts,tsx}` のみ |
| NFR-08 | Server Component 既定。Client Component は `*.client.tsx` で suffix を明示する |

### 1.3 ステークホルダー観点

| 系統 | 観点 |
|------|------|
| システム系 | 既存 3 layout は機能しているが `data-theme` / `data-shell` / `data-route` の selector hook を持っていないため、parallel-01/02 で追加した globals.css 規則が当たらない。この空白を埋めるのが本サブワークフローの唯一の責務 |
| 戦略・価値系 | 認証や route 構成を変更しないため、副作用 0 で「画面の雰囲気」を反映できる |
| 問題解決系 | 真の論点は「3 layout に共通 chrome 規約を機械化する `data-*` 契約を導入すること」。新規 layout や middleware の追加ではない |

## 2. 不変条件

CLAUDE.md「UI prototype alignment / MVP recovery」セクションの不変条件 1〜4 を継承する。

1. 既存 API endpoint surface のみ接続
2. OKLch トークン正本化
3. プロトタイプ正本順位
4. D1 直接アクセス禁止

加えて本サブワークフロー固有の不変条件:

5. 既存 layout を「新規作成」ではなく「編集」として扱う（既に 3 layout は存在する）
6. 既存 primitive（`PublicHeader` / `AdminSidebar` / `MemberHeader` / `PublicFooter` / `SignOutButton`）の props 変更禁止
7. 認証 / role gate ロジックは既存 `middleware.ts` と `getSession()` 経路を維持

## 3. スコープ境界

### IN

- `apps/web/app/(public)/layout.tsx` 編集（既存）
- `apps/web/app/(admin)/layout.tsx` 編集（既存）
- `apps/web/app/(member)/layout.tsx` 編集（既存）
- 上記 3 layout の `*.spec.tsx` 追加（React Testing Library + axe）

### OUT

- root `app/layout.tsx`（parallel-04 の責務）
- `app/error.tsx` / `app/not-found.tsx` / `app/loading.tsx`（parallel-04）
- 新規 primitive（`AdminTopbar` 等）の作成 — 既存 `MemberHeader` パターンと AdminSidebar 内導線で組み立てる
- 認証ロジック新規実装
- D1 schema 変更 / API endpoint 追加
- 19 routes の page.tsx（serial-05）

## 4. 受け入れ条件（タスク完了基準）

1. 3 layout が build green（`pnpm --filter @ubm-hyogo/web build`）
2. 3 layout の wrapper element に `data-theme` / `data-shell` / `data-route` 属性が機械的に付与される
3. `pnpm typecheck` / `pnpm lint` exit 0
4. layout 単体 spec が green（render snapshot + axe 0 critical violations）
5. 既存 middleware / `getSession()` の auth gate が回帰しない（既存 `apps/web/middleware.spec.ts` が green を維持）

## 5. 参照

- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-02-architecture.md` §3 AppShell 設計
- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
- `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`
- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`
- `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`
- `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx`
- `apps/web/app/(public)/layout.tsx`（編集対象）
- `apps/web/app/(admin)/layout.tsx`（編集対象）
- `apps/web/app/(member)/layout.tsx`（編集対象）
- `apps/web/middleware.ts`（読み取り専用・契約維持）
- `apps/web/src/lib/session.ts`（読み取り専用・契約維持）
