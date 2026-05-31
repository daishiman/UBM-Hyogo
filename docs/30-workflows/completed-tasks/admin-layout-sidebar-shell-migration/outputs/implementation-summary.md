# 実装サマリ — admin-layout-sidebar-shell-migration（Task A/B/D/E 一括実装）

実行日: 2026-05-29 / 区分: 実装（実コード変更あり）

## スコープ拡張の判断根拠（CONST_009 / ユーザー承認）

本タスク（Task D）単体は、前提となる **Task A（`SidebarShellServer`）/ Task B（`SidebarUserMenu`）が未実装**であり、
仕様書 phase-3.md の **NO-GO 条件①②が成立**していた（`apps/web/src/components/shell/` 不在）。
親ワークフロー `unified-sidebar-shell-public-and-admin` も `status: spec_created`。

このため実装着手前にユーザーへエスカレーションし、選択肢を提示。ユーザーは
**「Task A/B/D を一括実装」** を選択。これに従い、本サイクルで A/B/D に加え、layout が
mobileTriggerSlot に注入する **Task E の最小コンポーネント（`SidebarMobileTrigger`）** も実装した
（phase-3 NO-GO #4 が「暫定で空 slot を許容」としていた箇所を、機能する drawer trigger で充足）。

## 実コード変更（git diff で確認可能）

### 新規（Task A — shell core / Task B — user menu / Task E — mobile trigger）

| ファイル | 役割 |
| --- | --- |
| `apps/web/src/components/shell/shell-config.ts` | `buildNavForRole` / `isNavItemActive` / 型（SSOT・純関数） |
| `apps/web/src/components/shell/icons.tsx` | nav item id → 純粋 svg |
| `apps/web/src/components/shell/useSidebarState.ts` | collapse / drawer state hook |
| `apps/web/src/components/shell/SidebarShellContext.tsx` | drawer/collapse 操作 context |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | nav item（active = client `usePathname()`） |
| `apps/web/src/components/shell/SidebarNavGroup.tsx` | nav グループ |
| `apps/web/src/components/shell/SidebarNav.tsx` | nav グループ列 |
| `apps/web/src/components/shell/SidebarBrand.tsx` | ブランドブロック（旧 AdminBrandBlock の role-neutral 版） |
| `apps/web/src/components/shell/SidebarCollapseToggle.tsx` | 展開/折り畳みトグル |
| `apps/web/src/components/shell/SidebarShell.tsx` | client shell core（aside + drawer + content slot） |
| `apps/web/src/components/shell/SidebarShell.server.tsx` | server entry（getSession→role→nav→schemaDiffCount→shell） |
| `apps/web/src/components/shell/SidebarUserAvatar.tsx` | initials アバター（admin badge dot） |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | 左下 user menu（`<details>` popover・SignOutButton embed） |
| `apps/web/src/components/shell/user-menu-config.ts` | ロール別 action 集合（純関数） |
| `apps/web/src/components/shell/SidebarMobileTrigger.tsx` | mobileTriggerSlot（Task E 最小・drawer 起動） |
| `apps/web/src/lib/admin/schema-diff-count.ts` | schemaDiffCount SSOT（TECH-M-01 helper・`countQueuedDiffs` + `loadSchemaDiffCount`） |

### テスト（新規・全 `*.spec.{ts,tsx}`）

- `apps/web/src/components/shell/__tests__/shell-config.spec.ts`（9）
- `apps/web/src/components/shell/__tests__/user-menu-config.spec.ts`（3）
- `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx`（3）
- `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx`（8）
- `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx`（5）
- `apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx`（4・TC-04/05/06 相当）
- `apps/web/src/lib/admin/schema-diff-count.spec.ts`（4）

### 変更（Task D）

- `apps/web/app/(admin)/layout.tsx`: 旧 `AdminSidebar` 撤去 → `SidebarShellServer` 委譲。
  guard（`/login?next=/admin` / `/login?gate=forbidden`）+ admin shell DOM contract（`data-testid="admin-shell"` /
  `data-theme="cool"` / `data-route-group="admin"` / `data-shell-mode="sidebar"`）+ `<main data-route="admin">` 維持。
- `apps/web/app/(admin)/layout.spec.tsx`: Phase 4 マトリクスへ書き換え（TC-01/02/03/07/08）。
- `apps/web/src/styles/tokens.css`: shell 用トークン 5 件（`--shell-bar-w` 等）+ cool テーマ `--shell-active-bg` 追加。

### 削除（Task D・6 ファイル）

`AdminSidebar.tsx` / `AdminSidebarNavItem.tsx` / `AdminBrandBlock.tsx` + それぞれの spec 3 件。
**AC-2 gate**: `git grep -l "components/layout/AdminSidebar"`（code）= **0 hit**。

## 仕様からの補正（正本順位 #1 = 実コード優先）

| # | 当初仕様 | 実コード制約 | 本実装の扱い |
| --- | --- | --- | --- |
| 1 | useSidebarState は client Web Storage に collapse 状態を永続化 | `scripts/lint-boundaries.mjs` が `localStorage`/`sessionStorage` トークンを **forbidden**（apps/web/src 使用例ゼロ） | 永続化を撤廃し **in-memory（session 単位）** に限定。永続化は cookie 等での follow-up |
| 2 | SidebarShell が `<main>` flex-1 を描画 | layout が `<main data-route="admin">` を持つ DOM contract（TC-03） | shell は **chrome（sidebar + content slot）のみ**描画し semantic `<main>` は layout 所有。main の二重化回避（phase-5 多角的チェック観点） |
| 3 | inline style で aside 幅指定 | `scripts/verify-no-inline-style.sh` が `style={` を forbidden | Tailwind arbitrary value（`md:w-[var(--shell-bar-w)]` 等）+ `opacity-40` で表現 |
| 4 | layout.spec mock 方針 A（実 shell 統合） | async Server Component を RTL で同期 render 不可 | **方針 B（shell stub）**を採用。TC-04/05/06 は `SidebarShell.server.spec.tsx`（`await` 経由）+ `SidebarShell.spec.tsx` + `shell-config.spec.ts` + `schema-diff-count.spec.ts` へ委譲（phase-4.md が許容する fallback） |

## 検証結果（ローカル実行・全 green）

| コマンド | 結果 |
| --- | --- |
| `pnpm typecheck` | ✅ 全 6 workspace Done |
| `pnpm lint`（boundaries / deps / stablekey / no-inline-style / eslint） | ✅ OK |
| `verify-design-tokens`（tokens.runtime.spec） | ✅ 9 passed |
| shell + layout + helper test（8 files） | ✅ **41 passed** |
| 残存 `components/layout` 回帰（isActive / AdminTopbar / MemberHeader） | ✅ 16 passed |
| AC-2 grep gate `components/layout/AdminSidebar`（code） | ✅ 0 hit |

## DoD 充足

- Task A DoD: 3 spec green / typecheck・lint green / buildNavForRole 3 role × schemaDiffCount 安定 / 旧 AdminSidebar は D で削除 / mobileTriggerSlot 受け入れ ✅
- Task B DoD: spec green / 3 role action 集合 / SignOutButton `signOut({ redirectTo: '/login' })` 不変（embed・未改変）/ SidebarShellServer から直接描画 ✅
- Task D DoD: layout 書き換え（`import AdminSidebar` なし）/ schemaDiffCount SSOT 確定（helper）/ 6 削除 / spec 書き換え / grep 0 / typecheck green / DOM contract 維持 ✅

## 残（user-gated）

- commit / push / PR（CONST_002）
- staging deploy + 認証済み `/admin` の視覚ベースライン取得（Phase 11・project 既定で user-gated）
- collapse 状態の永続化（cookie 方式の follow-up・上記補正 #1）
- Task C（public/member layout 統合）/ Task E 完全版（drawer アニメーション・focus trap）は親ワークフローの別タスク
