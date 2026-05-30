# [#1015] Unified Sidebar Shell Task A: SidebarShell primitive

# Unified Sidebar Shell Task A: SidebarShell primitive

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | unified-sidebar-shell-task-a-sidebar-shell-primitive |
| タスク名 | 公開 / 会員 / 管理で共通利用する SidebarShell primitive 実装 |
| 分類 | implementation |
| 対象機能 | `apps/web/src/components/shell/**` |
| 優先度 | High |
| 見積もり規模 | Medium |
| ステータス | unassigned |
| 発見元 | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 発見日 | 2026-05-29 |

## 背景

親 workflow `unified-sidebar-shell-public-and-admin` は Phase 12 まで仕様化済みだが、親実装は Task B の UserMenu のみ完了している。Task A は Task E/C/D/F の前提となる shell primitive であり、未実装のままだと公開・会員・管理 layout 統合に進めない。

## 目的

`SidebarShell` / `SidebarShellServer` / nav config / collapse state を実装し、3 role (`viewer` / `member` / `admin`) の navigation contract を一箇所に集約する。

## 受け入れ条件

- `buildNavForRole()` が viewer/public、member/public+members、admin/public+members+admin を返す
- `SidebarShell` が expanded / collapsed の両状態で nav label と icon を正しく出し分ける
- `useSidebarState()` が SSR-safe で、`localStorage` key `ubm:shell:collapsed` に永続化する
- Task B の `SidebarUserMenu` を shell footer slot に接続できる hosting point がある
- `pnpm typecheck` / `pnpm lint` / shell focused tests が PASS する

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260528-225049-wt-11/docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive.md`
- 症状: Task B が先に実装されたため、`SidebarUserMenu` の props と未実装の `SidebarShell` footer/collapsed contract を後から整合させる必要がある。特に collapsed 時の `sr-only` label と popover 配置を Task A 側で壊さない設計が必要。
- 参照: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| admin nav item 数が旧 `AdminSidebar` と drift する | Phase 1 で現行 `apps/web/src/components/layout/AdminSidebar.tsx` を grep し、9 admin item / total 13 item を固定する |
| Server Component と Client Component の境界を誤り、`getSession()` を client に持ち込む | `SidebarShellServer` だけで session / schemaDiffCount を解決し、`SidebarShell` には plain object のみ渡す |
| collapsed state が SSR hydration mismatch を起こす | 初期値は deterministic に expanded とし、client mount 後だけ localStorage を読む |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell
```

期待: `shell-config` / `useSidebarState` / `SidebarShell` focused tests が PASS。

### 統合検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: exit code 0。`AdminSidebar` 削除は本タスクでは実施しない。

## スコープ

### 含む

- `SidebarShell` core primitive
- `SidebarShellServer`
- role-based nav config
- collapse state hook/context
- shell focused tests

### 含まない

- mobile drawer 実装（Task E）
- public/member layout 統合（Task C）
- admin layout migration / `AdminSidebar` 削除（Task D）
- visual baseline CI 化（Task F）

## 参照

- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive.md`
- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/implementation-guide.md`


