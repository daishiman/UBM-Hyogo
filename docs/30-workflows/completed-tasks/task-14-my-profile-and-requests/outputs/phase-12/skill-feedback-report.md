# Skill Feedback Report

## テンプレ改善

Finding: The existing task-specification-creator rules already require root artifacts, Phase 12 strict seven, state vocabulary, and same-wave sync.

Routing: no skill definition patch. The defect was incomplete application in this workflow package.

## ワークフロー改善

Finding: API path notation drift appeared between `/api/me/*` proxy paths and `fetchAuthed("/me/*")` component calls.

Routing: workflow-local fix in Phase 3/5/6/7/9. `fetchAuthed` component call strings are now canonical, and `/api/me/*` is described only as existing proxy implementation.

Finding: Phase 11 VISUAL_ON_EXECUTION evidence was initially under-specified. Component evidence and manual screenshots must be physically separated.

Routing: workflow-local fix. Added `outputs/phase-11/test-log.md` and `outputs/phase-11/manual-evidence-deferred.md`, then referenced both from the Phase 12 compliance check.

Finding: Dialog pure-UI split was over-claimed in docs while local code still owns submit side effects in dialogs.

Routing: workflow-local correction. The docs now describe this as a limitation/design target, not as a completed invariant.

## ドキュメント改善

Finding: task-14 was not reachable from aiworkflow-requirements indexes.

Routing: aiworkflow-requirements sync. Added resource-map, quick-reference, task-workflow-active, artifact inventory, changelog, and LOGS entries.

## No Skill Definition Patch

No `.claude/skills/task-specification-creator/` or `.claude/skills/aiworkflow-requirements/` instruction change is required. Existing skill rules were sufficient.
