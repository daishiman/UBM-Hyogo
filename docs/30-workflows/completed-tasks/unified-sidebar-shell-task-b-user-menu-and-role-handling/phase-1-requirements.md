# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

- task_id: `unified-sidebar-shell-task-b-user-menu-and-role-handling`
- parent_workflow: `unified-sidebar-shell-public-and-admin`
- source_task: `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-B-user-menu-and-role-handling.md`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- workflow_state: `implementation_verified`

## 要件

サイドバー左下のユーザーアイコンを起点とした popover で、ロール別 action 集合（プロフィール / 編集申請 / 管理者ダッシュボード / ログイン / ログアウト）を集約する。`viewer` / `member` / `admin` の 3 ロールを純関数で決定し、`SidebarShellServer`（Task A）から server で渡される `role` と `user` の plain object のみで表示を決める。新規 popover primitive は作らず、`<details>/<summary>` ベースで a11y 契約を満たす。

## Acceptance Criteria

| ID | 条件 |
| --- | --- |
| AC-B1 | `buildUserMenuActions(role)` が `viewer` / `member` / `admin` に対し、仕様書 §シグネチャの順序付き action 列を返す純関数として実装される |
| AC-B2 | `viewer` は `login` 1 件、`member` は `profile` + `edit-request` + `signout` の 3 件、`admin` は `profile` + `edit-request` + `admin-dashboard` + `signout` の 4 件 |
| AC-B3 | `SidebarUserMenu` は `<details>/<summary>` 構造で `aria-haspopup="menu"`、`<summary>` を `role="button"` 相当に整える |
| AC-B4 | route 変更時に popover が自動 close する（`usePathname` watch → `details.open = false`） |
| AC-B5 | 画面表示は「管理者」「会員」「ゲスト」のみ。コード識別子は `'admin' \| 'member' \| 'viewer'`。viewer は role ラベル非表示 |
| AC-B6 | `SidebarUserAvatar` は initials を表示し、`role === 'admin'` のみ `data-role="admin"` + 右下 badge dot を付与する |
| AC-B7 | `collapsed=true` 時はアバターのみ表示、label は `sr-only`。展開方向は md/lg で右側、drawer 内で上方向 |
| AC-B8 | 既存 `apps/web/src/components/auth/SignOutButton.tsx` を再 export せず embed し、`signOut({ redirectTo: '/login' })` 挙動は不変 |
| AC-B9 | API / D1 / Google Form schema / auth middleware / npm package は変更しない |
| AC-B10 | `user-menu-config.spec.ts` と `SidebarUserMenu.spec.tsx` の focused vitest がローカルで green |

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 親 source task | `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-B-user-menu-and-role-handling.md` | 仕様正本 |
| 親 Phase 1 | `docs/30-workflows/unified-sidebar-shell-public-and-admin/phase-1-requirements.md` | 親 AC-1..AC-7 整合 |
| 既存 SignOut | `apps/web/src/components/auth/SignOutButton.tsx` | embed 対象 / variant prop 追加検討 |
| Task A primitive | `apps/web/src/components/shell/SidebarShell.*` (Task A wave で先行配置) | `ShellRole` 型の供給元 |
| navigation 正本 | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | ロール表記 / 命名整合 |
| component 正本 | `.claude/skills/aiworkflow-requirements/references/ui-ux-components.md` | popover / avatar 表現整合 |

## 完了条件

AC-B1..AC-B10 が Phase 2 設計に trace され、root/output `artifacts.json` に `taskType=implementation` / `visualEvidence=VISUAL` / `workflow_state=implementation_verified` が同値で記録されている。
