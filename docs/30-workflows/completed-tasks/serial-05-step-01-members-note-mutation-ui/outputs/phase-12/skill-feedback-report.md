# Skill Feedback Report

## Summary

今回の改善は既存 skill 定義の適用で解決できるため、task-specification-creator / aiworkflow-requirements の skill 本体変更は不要。`spec_created` と `apps/` / `packages/` 差分の混在は既存ルールに従い `implemented_local_runtime_pending` へ再分類した。

## Routing

| Item | Category | Route | Evidence |
| --- | --- | --- | --- |
| Phase 12 strict 7 custom names | Workflow improvement | Applied to workflow files | `phase-12.md`, `outputs/phase-12/*` |
| root `artifacts.json` missing | Workflow improvement | Applied to workflow files | `artifacts.json` |
| Phase 13 PR gate ambiguity | Workflow improvement | Applied to workflow files | `phase-13.md` |
| parallel-08 / step-01 hook owner conflict | Documentation improvement | Applied to parent and child specs | `improvements/index.md`, `parallel-08-shared-foundation/spec.md`, `phase-02.md`, `phase-05.md` |
| spec_created with apps/packages diff | Workflow improvement | Reclassified in workflow files | `artifacts.json`, `outputs/artifacts.json`, `outputs/phase-11/*`, `outputs/phase-12/*` |
| AC-4 notes list/edit gap | Code improvement | Resolved in code and tests | `AdminMemberDetailView.notes`, `MemberDrawer.notes.integration.spec.tsx` |
| Skill definition gap | No-op | Existing skill rules already cover strict 7, user gate, same-wave sync | `phase-12-spec.md`, `phase12-compliance-check-template.md` |

## Template Improvements

No new template change required.

## Workflow Improvements

Use owner-boundary tables whenever a parent workflow names a shared hook/export structure and a child workflow creates the actual file.

## Documentation Improvements

aiworkflow-requirements entries were added for lookup and active workflow visibility.
