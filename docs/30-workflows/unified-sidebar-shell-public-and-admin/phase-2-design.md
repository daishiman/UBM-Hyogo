# Phase 2: 設計

## 設計方針

`apps/web/src/components/shell/` に shell primitive を新設し、layout 3 件は role 判定を再実装せず `SidebarShell.server.tsx` を呼び出す。A/B/E はコンポーネント内部で完結、C/D は layout 移行、F は visual/smoke evidence を担当する。

## 主要成果物

| 成果物 | Path |
| --- | --- |
| design SSOT | `outputs/phase-1-design.md` |
| architecture | `outputs/phase-2-architecture.md` |
| task inventory | `outputs/phase-3-task-inventory.md` |
| task specs | `tasks/task-A-sidebar-shell-primitive.md` .. `tasks/task-F-visual-baseline-smoke.md` |

## 依存関係

Task A/B/E の interface を先に固定する。Task C/D は A/B/E 完了後に layout を移行する。Task F は A-E 完了後の集約 gate とする。

## 完了条件

Phase 1 AC が A-F に分配され、旧 component 削除のタイミングが C/D の最後に限定されている。
