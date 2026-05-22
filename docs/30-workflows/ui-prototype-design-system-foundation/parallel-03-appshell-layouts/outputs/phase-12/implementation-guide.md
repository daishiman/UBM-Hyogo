# Implementation Guide — parallel-03 AppShell Layouts

## 概要

`apps/web/app/` 配下の **3 系統 AppShell layout**（公開・管理・会員）に、
parallel-01/02 で `globals.css` に追加された `[data-theme]` / `[data-shell]` / `[data-route]`
selector を機械的に当てるための共通 chrome 契約を実装した。

- 認証ロジック・middleware・既存 primitive の API はいずれも変更していない。
- 編集対象は 3 layout のみで、新規 primitive・新規 API endpoint・D1 schema 変更はなし。

## 変更ファイル

### 編集

- `apps/web/app/(public)/layout.tsx`
  - Fragment + `<div data-role="container">` から、`grid min-h-screen grid-rows-[auto_1fr_auto]` の wrapper `<div>` に再構成
  - wrapper に `data-theme="warm"` / `data-route-group="public"` / `data-testid="public-shell"` を付与
  - `<main>` を `data-route="public"` へ変更（`data-role="container"` を削除）

- `apps/web/app/(admin)/layout.tsx`
  - 既存 `getSession()` ベースの 2 段防御（未認証 → `/login?next=/admin`, non-admin → `/login?gate=forbidden`）はそのまま維持
  - wrapper の grid を `grid-rows-[auto_1fr] md:grid-cols-[240px_1fr]` に変更し topbar 行を追加
  - wrapper に `data-route-group="admin"` を追加
  - `<aside>` に desktop 限定 `md:row-span-2` を付与し、`<header data-shell="topbar">` を新設（現在地 label + actions slot placeholder）

- `apps/web/app/(member)/layout.tsx`
  - `member-shell` / `member-main` class を撤去し、`grid min-h-screen grid-rows-[auto_1fr]` の data-* 契約に統一
  - wrapper に `data-route-group="member"` を追加

### 追加 (`*.spec.tsx`)

- `apps/web/app/(public)/layout.spec.tsx` — data-* 契約 / chrome / axe critical 0
- `apps/web/app/(member)/layout.spec.tsx` — data-* 契約 / chrome / axe critical 0
- `apps/web/app/(admin)/layout.spec.tsx` — redirect 2 分岐 + authorized + axe critical 0

## 既存 primitive 無改変

`PublicHeader` / `PublicFooter` / `AdminSidebar` / `MemberHeader` / `SignOutButton`
のいずれも props / 関数シグネチャを変更していない（NFR-04 / DoD-06）。

## 検証結果

| Gate | 結果 |
|------|------|
| 3 layout Vitest spec | 10 passed / 10 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm verify:tokens` | ✓ 88 tracked |
| HEX 直書きスキャン | no matches |

## スコープ外（serial-07 委譲）

- AppShell の visual evidence は本 sub-workflow で public shell の実 screenshot を取得し、admin/member の full chrome は親 workflow の serial-07 で追加取得する
- `/privacy` / `/terms` / `/profile` の route group 再配置は serial-05 で扱う

## DoD トレース

DoD-01..10 すべて充足。詳細は `outputs/phase-11/evidence-inventory.md` 参照。
