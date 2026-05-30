---
Phase: 4
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-4-test-plan.md
正本: ../task-A-sidebar-shell-primitive.md（テスト節）
---

# Phase 4 — テスト計画 (task A)

## TDD: RED 期待

実装前に 3 spec ファイルを追加し、まず全ケース fail させてから Phase 5 で GREEN にする。

## spec ファイル一覧

### `apps/web/src/components/shell/__tests__/shell-config.spec.ts`

| ケース | 期待 |
|--------|------|
| `buildNavForRole('viewer')` | `[{id:'public', items:[home, directory, register]}]` |
| `buildNavForRole('member')` | public + members（profile を含む） |
| `buildNavForRole('admin', { schemaDiffCount: 0 })` | 3 グループ + admin items 9 件、schema badge なし |
| `buildNavForRole('admin', { schemaDiffCount: 3 })` | admin の schema item に `badge: { tone:'warn', count:3 }` |
| `isNavItemActive('/admin', '/admin/members')` | true（prefix 一致） |
| `isNavItemActive('/admin/members', '/admin/tags')` | false |

### `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx`

| ケース | 期待 |
|--------|------|
| 初期値 | `mode='expanded'` / `drawerOpen=false` |
| `toggleCollapsed` 1 回 | `mode='collapsed'` & `localStorage['ubm:shell:collapsed']==='true'` |
| マウント時 localStorage `true` | 初期 `mode='collapsed'` |
| SSR (window 未定義) | throw しない |

### `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx`

| ケース | 期待 |
|--------|------|
| viewer role render | nav item 3 件、UserMenu slot は空 |
| member role render | nav item 4 件（profile 含む） |
| admin role render | nav item 13 件（public 3 + members 1 + admin 9） |
| activePath マッチ | `aria-current='page'` 付与 |
| collapsed mode | nav label が `sr-only` クラスを持つ、`aria-expanded='false'` |
| `mobileTriggerSlot` 渡し | 渡した node が DOM に出現 |

## CONST_005 追跡

- 変更ファイル: artifacts.json `implementation_files` の通り
- 実行コマンド: phase-5 / phase-9 に記載
