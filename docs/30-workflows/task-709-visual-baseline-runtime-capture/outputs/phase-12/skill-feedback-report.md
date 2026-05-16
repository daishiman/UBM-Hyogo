# Skill Feedback Report

## Summary

One workflow lesson is promoted: runtime-gated visual tasks must rerun state synchronization after the gate passes. The detected failures were stale workflow-local ledgers after runtime capture: root spec status, Phase 9/12 evidence, aiworkflow ledgers, and workflow fail-open behavior.

## Routing

| Area | Finding | Routing |
| --- | --- | --- |
| task-specification-creator | Runtime gate 通過後に Phase 12 strict outputs / root spec / artifacts / QA / ledgers を再同期する明示 gate が弱い | promote pitfall in this report; future skill update candidate |
| aiworkflow-requirements | Same-wave ledger sync was stale after runtime capture and PR creation | applied in workflow / requirement ledgers |
| automation-30 | Compact 30-method table was sufficient for this scoped docs/spec improvement | no-op |
| workflow code | baseline 取得済み後も baseline 欠落時 skip 成功になり得た | `.github/workflows/playwright-visual-full.yml` を fail-fast に変更し、Playwright diff artifact paths を追加 |

## Evidence

- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260516-task-709-visual-baseline-runtime-capture.md`

## Future Skill Feedback Candidate

Runtime-gated implementation workflows should add a close-out check:

1. If Phase 11 runtime evidence changes after initial Phase 12, rerun Phase 12 synchronization in the same wave.
2. Re-check `index.md`, root/output `artifacts.json`, Phase 9 QA, Phase 12 strict 7, aiworkflow quick-reference/resource-map/task-workflow-active/changelog, and any follow-up task prerequisites.
3. Treat stale `runtime_pending` wording as a FAIL, even if the implementation files are correct.
