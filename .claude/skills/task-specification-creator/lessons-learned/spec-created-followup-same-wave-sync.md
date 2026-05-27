# spec_created follow-up same-wave sync

## Context

`admin-ui-prototype-alignment-followup-001-members-fetch-and-visual` exposed a recurring spec-generation drift: a workflow can start as `spec_created / implementation / VISUAL`, but once real `apps/` or `packages/` diffs exist it must be reclassified to `implemented_local_runtime_pending`. It still fails task-spec compliance if generated files claim completed sync without physical evidence.

## Lessons

| ID | Lesson | Gate |
| --- | --- | --- |
| L-SCFU-001 | AC tables must not be left as empty shells. If an output says `AC-1..AC-N are defined`, the root Phase 1 file must contain those rows. | `rg -n "^\\| AC-" phase-1-*.md` and compare against output summary |
| L-SCFU-002 | `spec_created` does not waive root/output artifacts parity. If the workflow has root `artifacts.json`, mirror `outputs/artifacts.json` or explicitly document why a validator-compatible mirror is impossible. | `test -f "$WF/artifacts.json" && test -f "$WF/outputs/artifacts.json"` |
| L-SCFU-003 | aiworkflow-requirements sync is same-wave work for implementation specs, even when runtime evidence, staging deploy, commit, push, and PR are user-gated. | quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS entries present |
| L-SCFU-004 | Phase 12 skill-feedback must not say `updated` while the owning skill files are unchanged. Use `updated` only after real skill/index files changed; otherwise say `no-op` with a concrete reason. | `git diff --name-only .claude/skills/aiworkflow-requirements .claude/skills/task-specification-creator` |
| L-SCFU-005 | 30-method automation evidence can be compact, but it must name all methods by category and tie them to concrete corrections. | Phase 12 compliance includes compact evidence table + 4-condition verdict |

## Applied Example

For `/admin/members` follow-up 001, the elegant fix was not to implement the app feature during spec review. The minimal compliant improvement was:

1. Fill AC-1..AC-9 in Phase 1.
2. Add `outputs/artifacts.json`.
3. Convert aiworkflow sync from deferred prose to actual same-wave skill files.
4. Add compact 30-method evidence and update the 4-condition verdict.

Runtime screenshots and staging deployment remain user-gated evidence because they require external operations, but the spec and skill ledgers must still be internally complete.
