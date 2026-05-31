---
task_id: admin-layout-sidebar-shell-migration
status: implemented_local_runtime_pending
task_type: implementation
visual_category: VISUAL
workflow_state: implemented_local_runtime_pending
created_at: 2026-05-29
implemented_at: 2026-05-29
scope_expansion: Task A/B/D/E 一括実装（ユーザー承認・CONST_009）。詳細は outputs/implementation-summary.md
canonical_workflow: docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/
parent_workflow: docs/30-workflows/unified-sidebar-shell-public-and-admin/
source_task: docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-D-admin-layout-migration.md
---

# admin-layout-sidebar-shell-migration

[実装区分: 実装仕様書]

> 親ワークフロー `unified-sidebar-shell-public-and-admin` の **Task D（Admin layout を SidebarShell へ移行）**
> 単体を Phase 1-13 の実行可能なタスク仕様書として展開したもの。
> source: `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-D-admin-layout-migration.md`

## 目的

`apps/web/app/(admin)/layout.tsx` を `SidebarShellServer`（Task A 提供）ベースへ置き換え、
既存 `AdminSidebar` 系コンポーネント群を削除する。admin 専用挙動（auth guard / schemaDiff badge）の
うち nav 構成・badge・ユーザーチップは shell 側へ移譲済みのため、layout の責務を
**auth guard + shell 呼び出し + admin shell DOM contract（`data-*` 属性）の維持**のみに縮約する。

## 実装完了記録（2026-05-29 / workflow_state=implemented_local_runtime_pending）

> spec_created → 実装完了。詳細は `outputs/implementation-summary.md`。

- **スコープ拡張（CONST_009・ユーザー承認）**: 前提の Task A（`SidebarShellServer`）/ Task B（`SidebarUserMenu`）が
  未実装だったため phase-3 NO-GO ①② が成立。ユーザー承認のもと **Task A/B/D + Task E 最小（`SidebarMobileTrigger`）を一括実装**した。
- **実コード変更**（`git diff` で確認可能）:
  - 新規 `apps/web/src/components/shell/`（15 component + 6 spec）/ `apps/web/src/lib/admin/schema-diff-count.ts`（+ spec）/ `apps/web/src/styles/tokens.css`（shell トークン 6 件）
  - 変更 `apps/web/app/(admin)/layout.tsx`（SidebarShellServer 委譲）/ `apps/web/app/(admin)/layout.spec.tsx`（TC-01/02/03/07/08）
  - 削除 旧 `AdminSidebar` 系 6 ファイル（AC-2 grep gate = 0 hit）
- **ローカル検証（全 green・2026-05-29）**: `pnpm typecheck` 6/6 Done / `pnpm lint` OK / web Vitest **1299 passed・1 skipped** / `git grep components/layout/AdminSidebar` 0 hit。
- **user-gated 残**: staging deploy + 認証済み `/admin` 視覚ベースライン（Phase 11 screenshot）/ commit / push / PR（CONST_001）。
- **follow-up**: collapse 状態の永続化（`scripts/lint-boundaries.mjs` が `localStorage`/`sessionStorage` を forbidden としているため cookie 方式へ分離）。詳細は `outputs/phase-12/unassigned-task-detection.md`。

## 実装区分の判定根拠（CONST_004）

- source task は `[実装区分: 実装仕様書]`。本タスクは `apps/web/app/(admin)/layout.tsx` の書き換えと
  6 ファイルの物理削除・既存 spec の書き換えを伴うため **実装仕様書**で確定。docs-only 例外には該当しない。
- CONST_005 必須項目（変更対象ファイル / シグネチャ / 入出力副作用 / テスト方針 / ローカル実行コマンド / DoD）は
  phase-1〜phase-13 に分散して全て充足する。

## source task からの乖離補正（実コード検証済み・2026-05-29）

source の実装スケッチには現行コードと食い違う箇所があり、本仕様では実コードを正本として補正した。

| # | source スケッチ | 実コード（正本） | 本仕様の扱い |
| --- | --- | --- | --- |
| 1 | `pnpm --filter @ubm/web` | package 名は `@ubm-hyogo/web` | 全コマンドを `@ubm-hyogo/web` に統一 |
| 2 | test 配置 `app/(admin)/__tests__/layout.spec.tsx` | 既存 `apps/web/app/(admin)/layout.spec.tsx`（7 ケース） | **既存 `layout.spec.tsx` を書き換え**。`__tests__/` は新設しない（invariant #8: `*.spec.tsx`） |
| 3 | `getSchemaDiffCount()` を `features/admin/schema-diff/get-schema-diff-count.ts` から呼ぶ | 同ファイル/関数は**不在**。現行は `safeServerFetch<SchemaDiffListView>("/admin/schema/diff")` の結果を `status === "queued"` で filter | schemaDiff count ロジックの SSOT を Task A ↔ Task D 境界として固定（phase-2 参照） |
| 4 | null session → `redirect('/login')` | 現行は `redirect('/login?next=/admin')` | 既存契約 `/login?next=/admin` を維持（回帰防止） |
| 5 | `pathname = (await headers()).get('x-pathname')` | `x-pathname` は middleware 含めコードベースに**不在** | server で pathname を解決しない。active state は client `usePathname()` 経由（現行 `AdminSidebarNavItem` と同方式）。`activePath` prop は SSR/test seed のみ |

## 前提（依存ゲート）

- **Task A 完成**: `apps/web/src/components/shell/SidebarShell.server.tsx`（`SidebarShellServer`）が
  admin role 判定・`buildNavForRole('admin')`・schemaDiffCount を扱う。
- **Task B 完成**: admin role の `SidebarUserMenu` が「プロフィール」「プロフィール編集申請」
  「管理者ダッシュボード」「ログアウト」を出す。
- 現時点で `apps/web/src/components/shell/` は**未作成**（Task A/B 未実装）。
  本タスクの**実装着手は A/B 完了が前提**（phase-1 前提条件 / phase-2 依存順序 / phase-3 NO-GO の 3 箇所で重複明記）。
- 本仕様の作成（spec_created）自体は A/B の完成を待たずに完結する。

## スコープ

### 含む

- `apps/web/app/(admin)/layout.tsx` の SidebarShellServer 移行
- 旧 `AdminSidebar` 系 6 ファイルの物理削除（phase-5 で列挙）
- 既存 `apps/web/app/(admin)/layout.spec.tsx` の書き換え（4 ケース + 既存 admin shell DOM contract 維持）
- admin shell DOM contract（`data-testid="admin-shell"` / `data-theme="cool"` / `data-route-group="admin"` /
  `data-shell-mode="sidebar"`）の維持

### 含まない

- Task A / B / C / E / F の実装（別タスク）
- 新規 API endpoint / D1 schema / Google Form 仕様の変更（親不変条件 #1）
- middleware への `x-pathname` 注入（不要・x-pathname 方式は不採用）

## 不変条件（親 workflow 継承 + 本タスク固有）

1. デザイントークンは `apps/web/src/styles/tokens.css` の OKLch / 既存 `--ubm-color-*` 変数のみ使用（HEX 直書き禁止）
2. ロール判定は `getSession()` の `SessionUser.isAdmin` 経由のみ（URL prefix / メール allowlist で再判定しない）
3. **admin 以外のロールで `/admin` 直叩きは `/login?gate=forbidden` へ redirect（fail-closed・親不変条件 #11）**
4. 未認証は `/login?next=/admin` へ redirect（既存契約維持）
5. ログアウトは Task B が embed する既存 `SignOutButton`（`signOut({ redirectTo: '/login' })`）を再利用、新設しない
6. D1 / API 追加変更なし。`getSession()` 由来 props + 既存 `safeServerFetch("/admin/schema/diff")` のみで描画する
7. `git grep -l "components/layout/AdminSidebar"` ヒット 0（旧コンポーネント完全除去）

## タスク種別 / visualEvidence

- `task_type=implementation`
- `visualEvidence=VISUAL`（admin shell の見た目が変わるため。Phase 11 は UI evidence セット）
- coverage AC: workspace 既定閾値（Statements/Branches/Functions/Lines >=80%、`apps/web`）

## 1 サイクル完結性（CONST_007）

本タスクは単一の関心事（admin layout 移行 + 旧 sidebar 削除）で構成され、後続実装プロンプトの
**1 サイクル内で完了できるスコープ**に収まる。先送り・別 PR・バックログ分離は行わない。
ただし**実装の着手順序**として Task A / B の完成が物理前提である点のみ依存ゲートとして明記する
（これはスコープ分割ではなく実行順序制約）。

## Phase 一覧

| Phase | ファイル | 役割 |
| --- | --- | --- |
| 1 | `phase-1.md` | 要件定義・AC・P50・依存ゲート |
| 2 | `phase-2.md` | 設計（layout 責務 / Task A 契約 / 削除スコープ / DOM contract） |
| 3 | `phase-3.md` | 設計レビュー（PASS/MINOR/MAJOR・NO-GO・simpler alternative） |
| 4 | `phase-4.md` | テスト計画（4 ケース + 回帰 + DOM contract） |
| 5 | `phase-5.md` | 実装（layout 書き換え + 削除 + spec 書き換え） |
| 6 | `phase-6.md` | 回帰確認・補助コマンド |
| 7 | `phase-7.md` | カバレッジ |
| 8 | `phase-8.md` | リファクタリング |
| 9 | `phase-9.md` | 品質保証 |
| 10 | `phase-10.md` | 最終レビューゲート |
| 11 | `phase-11.md` | manual test / visual evidence |
| 12 | `phase-12.md` | documentation（strict 7） |
| 13 | `phase-13.md` | 承認ゲート / PR |

## 正本順位（衝突時の優先度）

1. 実コード（`apps/web/app/(admin)/layout.tsx` ほか・grep で確認した実態）
2. `index.md`（本ファイル）
3. `phase-1.md` → `phase-13.md`
4. 親 `unified-sidebar-shell-public-and-admin/index.md` および `tasks/task-D-admin-layout-migration.md`
5. CLAUDE.md / `docs/00-getting-started-manual/specs/*.md`

## Phase 12 strict 7

| 成果物 | Path |
| --- | --- |
| main | `outputs/phase-12/main.md` |
| implementation-guide | `outputs/phase-12/implementation-guide.md` |
| system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` |
| documentation-changelog | `outputs/phase-12/documentation-changelog.md` |
| unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` |
| skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
