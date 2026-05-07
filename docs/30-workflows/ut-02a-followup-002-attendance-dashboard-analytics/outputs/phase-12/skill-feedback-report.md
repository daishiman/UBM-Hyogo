# Skill Feedback Report

## テンプレ改善

| Item | Promotion target | no-op reason | Evidence path |
| --- | --- | --- | --- |
| Phase 12 compliance must compare root `artifacts.json` and `outputs/artifacts.json`, not only check both files exist | `task-specification-creator` Phase 12 compliance template | applied locally by making outputs artifact an exact mirror; upstream skill already has parity guidance, so no separate skill patch is required | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| PR template checkboxes must distinguish local test PASS from runtime curl / screenshot pending | `task-specification-creator` Phase 13 template guidance | local workflow patched; upstream already requires Phase 13 approval gate, so no new template file needed | `phase-13.md` |

## ワークフロー改善

| Item | Promotion target | no-op reason | Evidence path |
| --- | --- | --- | --- |
| Once code exists, lifecycle should move from `spec_created` to `implemented-local` even if visual runtime evidence is pending | `aiworkflow-requirements` workflow status vocabulary | applied in workflow root and aiworkflow index; existing vocabulary already contains implemented-local examples | `artifacts.json`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| Runtime visual evidence should use stable screenshot filenames, not mixed `.md` / `.png` placeholders | `automation-30` evidence consistency checklist | local evidence ledger normalized; no reusable skill patch required | `index.md`, `outputs/phase-12/implementation-guide.md` |

## ドキュメント改善

| Item | Promotion target | no-op reason | Evidence path |
| --- | --- | --- | --- |
| Code-backed API/database facts must be reflected in manual specs during the same cycle | `aiworkflow-requirements` same-wave sync guide | implemented directly in `01-api-schema.md` and `08-free-database.md` | `docs/00-getting-started-manual/specs/01-api-schema.md`, `docs/00-getting-started-manual/specs/08-free-database.md` |
| Deleted member/session exclusion must be stated as the analytics invariant | `aiworkflow-requirements` API/database references | implemented in code, tests, and docs; no backlog item needed | `apps/api/src/repository/__tests__/attendance-analytics.test.ts` |
