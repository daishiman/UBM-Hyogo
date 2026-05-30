---
task_id: unified-sidebar-shell-public-and-admin
status: spec_created
task_type: implementation
visual_category: VISUAL
workflow_state: spec_created
created_at: 2026-05-28
canonical_workflow: docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/
---

# unified-sidebar-shell-public-and-admin

[実装区分: 実装仕様書（全 task A〜F） / Phase 1-13 仕様作成済み]

## 目的

公開層（未ログイン）／会員層（一般会員ログイン後）／管理層（admin ログイン後）の 3 種シェルを
**共通の collapsible Sidebar Shell** へ統合する。サイドバーは折り畳み可能（アイコンのみ表示）／
モバイル・タブレットでは drawer として表示し、左下のユーザーアバターから
プロフィール参照 / プロフィール編集申請 / ログアウト の 3 アクションへ集約する。

## 背景（観察された差分）

- `/`（public）= Top-header 構成（ブランド + 横並びナビ + ログイン CTA）
- `/admin`（admin）= 既に左 sidebar 構成（272px 固定・md 未満では非表示）
- `/profile`（member）= Top-header 構成（マイページ / 公開ページ / SignOut）
- → 同一ユーザーが「ログイン → /profile → /admin」と遷移するときに UI が 2 度変わる

## ロール語彙（用語固定）

| ロール語 | 用途 | 判定 |
|---------|------|------|
| 公開閲覧者 (`viewer`) | 未ログイン | `session === null` |
| 会員 (`member`) | ログイン済み・admin 権限なし | `session.isAdmin === false` |
| 管理者 (`admin`) | ログイン済み・admin 権限あり | `session.isAdmin === true` |

「管理者」と「アドミン」「Admin」の表記は混在禁止。日本語表示は**管理者**、コード識別子は **admin**、
URL は `/admin/*`、ロール語の比較は `session.isAdmin` のみで行う。

## スコープ（19 routes に対する適用）

| 層 | sidebar mode | UserMenu(左下) |
|----|-------------|----------------|
| 公開 6 routes (`/`, `/members`, `/register`, `/privacy`, `/terms`, `/login`) | collapsible sidebar（公開項目のみ・ゲストには「ログイン」CTA） | guest avatar + 「ログイン」リンク |
| 会員 1 route family (`/profile` + segment states) | collapsible sidebar（公開項目 + マイページ） | member avatar + プロフィール / 編集申請 / ログアウト |
| 管理 9 routes | collapsible sidebar（公開3 + 会員1 + 管理9 = 全13 nav item） | admin avatar + プロフィール / 編集申請 / 管理者ダッシュボード / ログアウト |
| 共通状態 (error/not-found/loading) | 親 layout を継承 | 同上 |

## 不変条件

1. デザイントークンは `apps/web/src/styles/tokens.css` の OKLch 正本のみ使用（HEX 直書き禁止）
2. プロトタイプ正本順位（CLAUDE.md `UI prototype alignment / MVP recovery` 節）を継承
3. ロール判定は `apps/web/src/lib/session.ts` の `SessionUser.isAdmin` 経由のみ。URL prefix / メール allowlist で再判定しない
4. ログアウトは既存 `SignOutButton`（`signOut({ redirectTo: '/login' })`）を再利用、新設しない
5. 「プロフィール編集」は MVP の方針上 read-only + 「編集申請」遷移であり、直接編集 UI を新設しない（CLAUDE.md 不変条件 #7）
6. D1 / API 追加変更なし。既存 `getSession()` 由来 props のみで描画する

## 正本順位

1. `index.md`（本ファイル）
2. `artifacts.json` / `outputs/artifacts.json`（workflow state / gates / Phase 1-13）
3. `phase-1-requirements.md` → `phase-13-pr.md`
4. `outputs/phase-1-design.md` → `outputs/phase-2-architecture.md` → `outputs/phase-3-task-inventory.md`
5. `tasks/task-{A..F}-*.md`
6. CLAUDE.md / `docs/00-getting-started-manual/specs/*.md`

## タスク一覧

| ID | タスク | 並列可否 | 依存 |
|----|-------|---------|------|
| A | SidebarShell primitive（collapsible core） | 並列可 | なし |
| B | UserMenu（左下ロール対応アバター + 3 action） | 並列可 | なし |
| C | Public layout 統合 | 直列 | A, B 完了後 |
| D | Admin layout 移行（既存 AdminSidebar を SidebarShell へ） | 直列 | A, B 完了後 |
| E | Mobile/tablet drawer + responsive | 並列可（A と部分並行可） | A の interface 確定後 |
| F | Visual baseline + smoke spec | 直列 | A〜E 完了後 |

本 workflow は `spec_created / implementation / VISUAL`。今回サイクルでは Phase 1-13 仕様、Phase 12 strict 7、
aiworkflow-requirements 同期を完了し、A〜F の実コード実装・local visual capture・commit・push・PR は
Gate-B/C の user-gated execution wave として扱う。未タスク分離は行わない。

## Sub-workflow topology

`task-A-sidebar-shell-primitive` は単独 root ではなく、親 workflow 配下の sub-workflow として管理する。
standalone 生成された `docs/30-workflows/task-A-sidebar-shell-primitive/` は同一 wave で
`docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive/` へ統合済み。
親 `artifacts.json` / `outputs/artifacts.json` の `metadata.sub_workflows` が正本である。

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
