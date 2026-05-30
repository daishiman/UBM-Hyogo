---
Phase: 12
status: completed
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-12-documentation.md
---

# Phase 12 — ドキュメント同期 (task A)

## strict 7 出力

`outputs/phase-12/` 配下に以下 7 ファイルを配置:

1. `main.md`
2. `implementation-guide.md`（中学生レベル + 技術詳細 + Phase 11 視覚証跡セクション）
3. `system-spec-update-summary.md`（Step 1-A/1-B/1-C/Step 2）
4. `documentation-changelog.md`（workflow-local + global skill sync）
5. `unassigned-task-detection.md`（0 件、`current` baseline）
6. `skill-feedback-report.md`（改善点なし）
7. `phase12-task-spec-compliance-check.md`（canonical 9-heading）

## 同期対象 system spec

- `docs/00-getting-started-manual/specs/ui-ux-navigation.md`: SidebarShell role-aware navigation の仕様追記
- `docs/00-getting-started-manual/specs/ui-ux-components.md`: SidebarShell / shell-config 型を primitive として追記

いずれも `spec_created` 状態の追記であり、実装合流は親 workflow の wave で行う。
