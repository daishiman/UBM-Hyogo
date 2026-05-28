# Phase 1: 要件定義

## メタ情報

- task_id: `unified-sidebar-shell-public-and-admin`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- workflow_state: `spec_created`

## 要件

公開層、会員層、管理層の shell を `SidebarShell` primitive に統一する。対象は public 6 routes、member `/profile`、admin 9 routes。既存 `AdminSidebar` の Public / Members / Admin 構成、schemaDiff badge、user chip、sign out 挙動を欠落させない。

## Acceptance Criteria

| ID | 条件 |
| --- | --- |
| AC-1 | `/`, `/profile`, `/admin` が同一 `SidebarShell` DOM 契約を共有する |
| AC-2 | role は `viewer` / `member` / `admin` のみ。判定は `SessionUser.isAdmin` のみ |
| AC-3 | nav item は public 3 + members 1 + admin 9 = admin 時 13 件 |
| AC-4 | `<768px` drawer、`768-1023px` 初期 collapsed、`>=1024px` persistent sidebar |
| AC-5 | UserMenu は viewer 1 action、member 3 action、admin 4 action |
| AC-6 | API / D1 / Google Form schema / auth middleware 変更なし |
| AC-7 | typecheck / lint / focused unit / Playwright smoke が実装 wave の gate になる |

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| current admin shell | `apps/web/src/components/layout/AdminSidebar.tsx` | nav 構成と schemaDiff badge の現行正本 |
| public layout | `apps/web/app/(public)/layout.tsx` | public shell owner |
| member layout | `apps/web/app/(member)/layout.tsx` | member shell owner |
| admin layout | `apps/web/app/(admin)/layout.tsx` | admin auth gate owner |
| system spec | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | navigation 正本 |
| system spec | `.claude/skills/aiworkflow-requirements/references/ui-ux-components.md` | UI component 正本 |

## 完了条件

AC-1..AC-7 が Phase 2 以降へ trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録されている。
