# Phase 12 Task Spec Compliance Check Template

Use this template when generating
`outputs/phase-12/phase12-task-spec-compliance-check.md`. The check must compare
the task specification, actual changed files, evidence files, and system ledgers.

## Required Sections

1. Summary verdict
2. Changed-files classification
3. `workflow_state` and phase status consistency
4. Phase 11 evidence file inventory
5. Phase 12 strict 7 file inventory
6. Skill/reference/system spec same-wave sync
7. Runtime or user-gated boundary
8. Archive/delete stale-reference gate
9. Four-condition verdict

## Verification Commands

```bash
git status --short
git diff --stat
test -f docs/30-workflows/<task>/artifacts.json
test -f docs/30-workflows/<task>/outputs/artifacts.json
find docs/30-workflows/<task>/outputs/phase-12 -maxdepth 1 -type f | sort
rg -n 'workflow_state|PASS_BOUNDARY_SYNCED_RUNTIME_PENDING|implemented_local_evidence_captured' docs/30-workflows/<task>
rg -n '<workflow-root-name>' .claude/skills/aiworkflow-requirements .claude/skills/task-specification-creator docs/30-workflows
```

For every stale-reference hit, classify it as live inventory, active workflow,
consumed trace, historical changelog, lessons, or generated index. A deleted
root with any live inventory / active workflow / consumed trace hit is FAIL
unless the same wave restores the root or rewrites those references to a new
canonical root.

For skill-promotion tasks, also verify:

```bash
rg -n 'workflow-state-vocabulary|phase12-compliance-check-template' .claude/skills/task-specification-creator/SKILL.md
rg -n 'workflow-state-vocabulary|phase12-compliance-check-template' .claude/skills/task-specification-creator/references/phase-12-spec.md .claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md .claude/skills/task-specification-creator/references/phase-template-phase11.md
```

## Drift Patterns

| Pattern | FAIL condition | Fix |
| --- | --- | --- |
| Spec-only root claims implementation complete | `metadata.workflow_state=spec_created` while Phase 11/12 says local implementation is done | Reclassify or remove implementation-complete wording. |
| Runtime PASS without runtime evidence | `PASS` or `completed` is written while production/staging evidence is pending | Use `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` and attach pending evidence path. |
| Missing Phase 12 files | Any of the strict 7 file names are absent | Create the exact canonical filenames. |
| Stale deleted root | A workflow root is deleted while live inventory, active workflow, consumed trace, quick-reference, resource-map, or task-workflow points to it | Restore/move the root or update all ledgers in the same wave; historical-only hits must be labeled as such. |
| Skill feedback not promoted | `skill-feedback-report.md` names a target but owning skill files are unchanged | Apply the owning skill/reference update or mark a scoped no-op with evidence. |

## Four-Condition Verdict Template

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS/FAIL | State, scope, and evidence wording do not conflict. |
| 漏れなし | PASS/FAIL | Required skill outputs and Phase 12 files are present. |
| 整合性あり | PASS/FAIL | Terms, paths, JSON metadata, and ledger entries match. |
| 依存関係整合 | PASS/FAIL | Upstream/downstream tasks, moved/deleted roots, and indexes are synchronized. |
