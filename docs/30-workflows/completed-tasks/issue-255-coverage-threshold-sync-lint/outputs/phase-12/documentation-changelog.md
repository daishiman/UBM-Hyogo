# Documentation Changelog

## Entry Checklist

```text
$ git status --porcelain docs/30-workflows/issue-255-coverage-threshold-sync-lint
?? docs/30-workflows/issue-255-coverage-threshold-sync-lint/
```

This cycle includes the implementation. Code, CI workflow, root package script, workflow docs, Phase 11 evidence, and aiworkflow ledgers are changed in the same wave.

The referenced `docs/30-workflows/unassigned-task/task-codecov-threshold-sync-lint-001.md` was consumed and moved to `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md`.

## Changed Paths

| Path | Change |
| --- | --- |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/index.md` | new (runbook + scope) |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/artifacts.json` | new (workflow_state=spec_created, phase-1..12 completed, phase-13 blocked) |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-01.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-02.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-03.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-04.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-05.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-06.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-07.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-08.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-09.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-10.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-11.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-12.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-13.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/outputs/phase-12/main.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/outputs/phase-12/implementation-guide.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/outputs/phase-12/documentation-changelog.md` | new (this file) |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/outputs/phase-12/unassigned-task-detection.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/outputs/phase-12/skill-feedback-report.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/outputs/phase-12/system-spec-update-summary.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/outputs/phase-12/phase12-task-spec-compliance-check.md` | new |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/outputs/phase-11/evidence/lint-coverage-threshold.log` | new evidence |
| `docs/30-workflows/issue-255-coverage-threshold-sync-lint/outputs/phase-11/evidence/vitest-coverage-threshold-lint.log` | new evidence |
| `scripts/coverage-threshold-lint.ts` | new implementation |
| `scripts/__tests__/coverage-threshold-lint.spec.ts` | new focused tests |
| `.github/workflows/coverage-threshold-lint.yml` | new CI workflow |
| `package.json` | add `lint:coverage-threshold`; wire focused spec into `test:scripts` |
| `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md` | moved from unassigned-task and marked consumed_by_issue_255 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-255-coverage-threshold-sync-lint-artifact-inventory.md` | new artifact inventory |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | add issue-255 row |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | add issue-255 row |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | add issue-255 row |
| `.claude/skills/aiworkflow-requirements/changelog/20260526-issue255-coverage-threshold-sync-lint.md` | new changelog |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` / `LOGS/_legacy.md` | add issue-255 sync row |

## Skill Ledger

| Category | Path | Result |
| --- | --- | --- |
| skill 正本 | `.claude/skills/aiworkflow-requirements/SKILL.md` | not edited (existing coverage/CI triggers cover this task) |
| skill changelog | `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | issue-255 sync row added |
| skill references | `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` | not edited (SSOT read-only target) |
| skill indexes | `.claude/skills/aiworkflow-requirements/indexes/` | quick-reference/resource-map entries added |
| system spec | `docs/00-getting-started-manual/specs/00-overview.md` | not edited (system overview に影響なし) |

`task-specification-creator` was consulted but not edited in this wave. The patterns (CLOSED issue Refs spec, dynamic source mode, Markdown SSOT regex extraction) are routed to `skill-feedback-report.md` as applied examples; existing strict 7 / 9 canonical heading / NON_VISUAL Phase 11 evidence inventory rules already absorb this workflow without same-wave skill edits.

## Validator / Command Evidence

| Command | Exit | Evidence |
| --- | --- | --- |
| `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/issue-255-coverage-threshold-sync-lint` | 0 | 12/12 checks PASS（PHASE12_IMPLEMENTATION_GUIDE_OK） |
| `pnpm gate-metadata:validate` | 0 | WARN only for metadata.gates absent on this workflow; ERROR=0 |
| `pnpm verify:phase12-compliance` | 0 | 9 canonical headings present + Phase 11 evidence inventory present/pending rows |
| `pnpm indexes:rebuild` | 0 | aiworkflow-requirements topic-map / keywords regenerated |
| `pnpm lint:coverage-threshold` | 0 | OK sources=2 threshold=80 |
| `pnpm exec vitest run scripts/__tests__/coverage-threshold-lint.spec.ts` | 0 | 8 tests passed |
| `pnpm typecheck` | 0 | workspace typecheck passed |
| `pnpm observation:lint` | 0 | observation shell tests PASS=13 FAIL=0 + actionlint all workflows |
