---
Phase: 12
status: completed
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../../../outputs/phase-12/system-spec-update-summary.md
---

# Phase 12 — system spec update summary (task A)

## Step 1-A: 影響範囲特定

| spec ファイル | 影響 |
|--------------|------|
| `docs/00-getting-started-manual/specs/ui-ux-navigation.md` | SidebarShell の role-aware navigation（viewer/member/admin）を追記 |
| `docs/00-getting-started-manual/specs/ui-ux-components.md` | SidebarShell / shell-config 型を primitive 一覧に追記 |
| `docs/00-getting-started-manual/specs/design-tokens.md` | shell 用 5 トークン（`--shell-bar-w` 他）を追記 |

## Step 1-B: 追記内容案

- ui-ux-navigation.md: 「3 層共通 SidebarShell」節を新設し `buildNavForRole(role)` の出力テーブルを記載
- ui-ux-components.md: SidebarShell primitive と `SidebarShellProps` を Component Catalog に追加
- design-tokens.md: shell 5 トークンの OKLch 値と用途を表で記載

## Step 1-C: 状態

`spec_created`。本 wave では aiworkflow-requirements の workflow ledgers に task-A sub-workflow topology を同期済み。実装合流後の UI system spec 実値（token 値 / component catalog / navigation table）は Gate-B execution wave で追記するため、本サブworkflow では **追記設計のみ** を確定する。

## Step 2: 同期タイミング

実装サイクル（Gate-B 通過後）と同時に system spec を update する。本サブworkflow 単体では UI system spec 本文への実書き込みは行わない（親 task-A.md と本 implementation-guide が実装前 SSOT になる）。
