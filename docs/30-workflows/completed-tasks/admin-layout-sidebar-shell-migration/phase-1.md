# Phase 1: 要件定義

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- task_type: `implementation`
- visualEvidence: `VISUAL`
- 実装区分: **実装仕様書**（CONST_004 判定根拠は `index.md` 参照）
- 作成日: 2026-05-29
- 親 workflow: `unified-sidebar-shell-public-and-admin`（Task D）

## 目的

`apps/web/app/(admin)/layout.tsx` を Task A 提供の `SidebarShellServer` ベースへ移行し、
旧 `AdminSidebar` 系コンポーネント群を完全除去する。layout の責務を
**auth guard + shell 呼び出し + admin shell DOM contract 維持**へ縮約する。

## Step 0: P50 チェック（既存実装状態の確認）

Phase 1 着手前に `git log` / `grep` で実態を確認済み（2026-05-29、本ワークツリー detached HEAD `742323e4e`）。

| 確認対象 | コマンド | 結果（正本） |
| --- | --- | --- |
| layout 実体 | `cat apps/web/app/(admin)/layout.tsx` | `loadSchemaDiffCount()` → `safeServerFetch<SchemaDiffListView>("/admin/schema/diff")` を queued filter / `getSession()` guard / `AdminSidebar` を `<aside class="hidden md:block">` 内に mount / `export const dynamic = "force-dynamic"` |
| 既存テスト | `cat apps/web/app/(admin)/layout.spec.tsx` | 7 ケース存在（null→`/login?next=/admin` / non-admin→`/login?gate=forbidden` / shell DOM contract / 単独『管理』なし / fetch 失敗時 badge なし / queued のみ count / axe critical 0） |
| AdminSidebar 実体 | `cat apps/web/src/components/layout/AdminSidebar.tsx` | client component。Public 3 / Members 1 / Admin 9 = 全 13 nav item。`schemaDiff` badge / 左下 user chip + `SignOutButton` を内包 |
| active state 機構 | `grep usePathname apps/web/src/components/layout/AdminSidebarNavItem.tsx` | `usePathname()` で client 判定（`isActive(href, pathname)` → `aria-current="page"` / `data-active`） |
| shell dir | `ls apps/web/src/components/shell/` | **不在**（Task A/B 未実装） |
| schema-diff helper | `find apps/web/src -path '*schema-diff*'` | **不在**（source スケッチの `getSchemaDiffCount()` は存在しない） |
| x-pathname | `git grep -l x-pathname apps/web/` | **0 件**（middleware 含め未使用） |
| package 名 | `grep '"name"' apps/web/package.json` | `@ubm-hyogo/web` |
| 削除対象の外部参照 | `git grep -ln AdminSidebar apps/web` | `layout.tsx` / `layout.spec.tsx` / `AdminSidebar.spec.tsx` / `AdminSidebar.component.spec.tsx` のみ。`AdminSidebarNavItem` / `AdminBrandBlock` は `components/layout/` 内のみで参照 |

→ 既存コードが新 AC（SidebarShell 移行）を満たさない状態。greenfield ではなく **既存実装の置換**として扱う。

## Step 0 補助: worktree / 現況

- worktree: `.worktrees/task-20260529-060158-wt-16`（detached HEAD、`742323e4e` = `origin/dev`）
- browser extension 由来ログ・dev-only asset は本タスクスコープ外。

## 受け入れ基準（Acceptance Criteria）

- **AC-1**: 移行後 `apps/web/app/(admin)/layout.tsx` は `SidebarShellServer`（Task A）を呼び出し、
  `import { AdminSidebar }` を含まない。
- **AC-2**: `git grep -l "components/layout/AdminSidebar"` のヒットが **0 件**（旧コンポーネント群と全 spec を削除）。
- **AC-3**: 未認証（`session === null`）で `/admin` にアクセスすると `/login?next=/admin` へ redirect する（既存契約維持）。
- **AC-4**: `session.isAdmin === false` のロールで `/admin` を直叩きすると `/login?gate=forbidden` へ redirect する（fail-closed・親不変条件 #11）。
- **AC-5**: admin session で SidebarShell が描画され、nav に **Public 3 + Members 1 + Admin 9 = 全 13 item** が表示される。
- **AC-6**: `schemaDiffCount` が `safeServerFetch("/admin/schema/diff")` の `status === "queued"` 件数で算出され、
  `> 0` のとき schema nav に warn badge、fetch 失敗時は count=0 で badge 非表示（既存挙動と一致）。
- **AC-7**: admin shell DOM contract（`data-testid="admin-shell"` / `data-theme="cool"` /
  `data-route-group="admin"` / `data-shell-mode="sidebar"` / `<main data-route="admin">`）が維持される。
- **AC-8**: `apps/web/app/(admin)/layout.spec.tsx`（既存ファイルを書き換え）の全ケースが green。
- **AC-9**: `pnpm typecheck && pnpm lint && pnpm --filter @ubm-hyogo/web test --run` が green。
- **AC-10**: coverage（`apps/web`）が Statements/Branches/Functions/Lines >=80%、`bash scripts/coverage-guard.sh` exit 0。

## 実行タスク

1. 実コードの現況を P50 で固定（完了・上表）。
2. Task A/B 契約の前提を明示（下記「前提条件」）。
3. AC を番号付きで定義（完了・上記）。
4. Phase 2 へ渡す入力（削除スコープ・layout 新形・Task A 契約）を確定する。

## 前提条件（依存ゲート — gate 重複明記 1/3）

- **Task A 完成必須**: `apps/web/src/components/shell/SidebarShell.server.tsx` の `SidebarShellServer`
  が `{ activePath, children, mobileTriggerSlot }` を受け取り、内部で `getSession()` → role 判定 →
  `buildNavForRole('admin', { schemaDiffCount })` → `<SidebarUserMenu />` → `<SidebarShell />` を描画する。
- **Task B 完成必須**: admin role の `SidebarUserMenu` が「プロフィール / プロフィール編集申請 /
  管理者ダッシュボード / ログアウト」を出す。
- **schemaDiffCount の SSOT 未確定** が上流ブロッカー: 現行 `layout.tsx#loadSchemaDiffCount`（`safeServerFetch("/admin/schema/diff")` + queued filter）を
  Task A の `SidebarShellServer` が引き継ぐか、共有 helper へ抽出するかを Phase 2 で確定する。
- 上記 3 点が未確定の間は **Phase 5（実装）に進まない**。本仕様（spec_created）の作成は前提充足を待たない。

## 参照資料

- source: `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-D-admin-layout-migration.md`
- Task A 仕様: `.../tasks/task-A-sidebar-shell-primitive.md`
- Task B 仕様: `.../tasks/task-B-user-menu-and-role-handling.md`
- 実コード: `apps/web/app/(admin)/layout.tsx` / `layout.spec.tsx` / `apps/web/src/components/layout/AdminSidebar*.tsx`
- `apps/web/src/lib/session.ts`（`getSession()` / `SessionUser`）
- `apps/web/src/lib/admin/safe-server-fetch.ts`（`safeServerFetch`）
- 親不変条件: `CLAUDE.md` §「UI prototype alignment / MVP recovery」/ 不変条件 #11

## 実行手順

### ステップ1: P50 で実態固定（完了）

### ステップ2: AC 番号定義（完了・AC-1〜AC-10）

### ステップ3: 依存ゲートと NO-GO 条件の起点を記録

Phase 3 の NO-GO 条件（Task A/B 未完成での実装着手禁止）の起点を本 Phase に記録した。

## 統合テスト連携

- 検証対象は `apps/web/app/(admin)/layout.spec.tsx`（既存書き換え）。
- 新規テストは `*.spec.tsx` のみ（invariant #8）。`__tests__/layout.spec.tsx` は新設しない。

## 多角的チェック観点（AIが判断）

- placeholder（`x-pathname` / `getSchemaDiffCount`）を spec に持ち込まない（実在 API/関数のみ）。
- 既存契約（`/login?next=/admin`）を回帰させない。
- 削除と新形 mount を同一 Phase 5 で行い、`git grep` 0 件を DoD にする。

## サブタスク管理

- 本タスクは単一責務（admin layout 移行）。サブタスク分割なし。

## 成果物

- 本 Phase の成果物: AC 定義 / P50 結果 / 依存ゲート（本ファイル）。

## 完了条件

- [ ] P50 で実態を固定した
- [ ] AC-1〜AC-10 を番号付きで定義した
- [ ] 依存ゲート（Task A/B）を明記した
- [ ] coverage AC（>=80% / `coverage-guard.sh` exit 0）を含めた

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」全項目を満たした
- [ ] source スケッチとの乖離 5 点を補正した（`index.md` 表）

## 次Phase

Phase 2（設計）。
