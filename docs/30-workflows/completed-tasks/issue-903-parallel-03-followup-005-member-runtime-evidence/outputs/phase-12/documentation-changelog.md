# Phase 12 — documentation-changelog

[実装区分: 実装仕様書]

## 追加

- `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/` ディレクトリ新設（実装完了状態のため completed-tasks 直配置）
  - `index.md`, `artifacts.json`, `phase-01..13-*.md`
  - `outputs/phase-12/*.md`（strict 7 file inventory）
  - `outputs/phase-11/`（実装時に evidence を投入）

## 更新（実装時）

- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md`: EV-13 / EV-16 を `present` 昇格、委譲注記更新
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt` 新規
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/screenshots/member-shell.png` 新規
- `.claude/skills/aiworkflow-requirements/indexes/{quick-reference.md,resource-map.md}` と `references/task-workflow-active.md`: current profile implementation targets を `apps/web/app/(member)/profile/**` へ同期
- `.claude/skills/aiworkflow-requirements/references/workflow-*.md`: profile 関連 artifact inventory の current physical path を `(member)/profile` へ同期
- `.claude/skills/aiworkflow-requirements/references/{quality-e2e-testing.md,arch-state-management-core.md}`: static invariant / state management の検査対象 path を現行 route group 配置へ同期

## 削除/移動

- 旧 `apps/web/app/profile/` ディレクトリは `(member)/profile/` に git mv 後に削除（URL 不変）
