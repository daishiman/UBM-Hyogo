# Skill Feedback Report

## task-specification-creator Feedback

### テンプレ改善

Conditional implementation tasks need an explicit path for `verified_current_no_code_change_pending_pr` when primary-source revalidation proves that the requested implementation is currently unsupported.

### ワークフロー改善

Phase 12 compliance should fail early when root `artifacts.json` is `{ "artifacts": [] }` or when strict 7 outputs are only listed in `phase-12-documentation.md` but missing on disk.

Unsupported conditional implementations need a stale-claim grep gate across Phase 1-13. If the final state is `verified_current_no_code_change_pending_pr`, current-cycle DoD must not still require implementation artifacts such as `id-token: write`, runtime deploy logs, rollback rehearsals, or missing Phase 11 files.

### ドキュメント改善

For OIDC / secret-boundary tasks, Phase 1 should require a primary-source support snapshot before any `id-token: write` implementation plan is treated as executable.

Promotion completed in `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` and `.claude/skills/task-specification-creator/LOGS/_legacy.md` on 2026-05-16.

## aiworkflow-requirements Feedback

The existing Step 2 trigger for OIDC is correct. This cycle adds the inverse case: when OIDC support is not documented, system specs must record the no-code decision and preserve the current secret boundary instead of drifting into a speculative future contract.

## automation-30 Feedback

The compact 30-method evidence table was useful. The recurring failure cluster was: state, evidence, canonical sync, unassigned formalization. Future automation can make those four groups explicit before detailed design review.
