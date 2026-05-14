# Documentation Changelog

| Date | Area | Change |
| --- | --- | --- |
| 2026-05-11 | workflow | Added `artifacts.json`, Phase 11 NON_VISUAL evidence stubs, Phase 12 strict 7 outputs, and corrected Phase 9 to preserve `coverage-gate` context |
| 2026-05-11 | aiworkflow-requirements | Registered Issue #617 in quick-reference, resource-map, task-workflow-active, artifact inventory, and changelog |
| 2026-05-11 | source trace | Marked the #618 historical unassigned follow-up as expanded/consumed by the #617 workflow |
| 2026-05-11 | review fix | Promoted state to `implemented_local_runtime_pending`, mirrored root/output artifacts, made shard mode artifact-only, added aggregate `always()` fail-closed behavior, fixed api merge cwd, wired coverage-merge tests into CI, and normalized classification to `api-d1=94` / `api-unit=44` |

## Verification commands

| Command | Expected |
| --- | --- |
| `test -f docs/30-workflows/issue-617-ci-test-time-reduction-split/artifacts.json` | exit 0 |
| `find docs/30-workflows/issue-617-ci-test-time-reduction-split/outputs/phase-12 -maxdepth 1 -type f | wc -l` | at least 7 |
| `rg -n "issue-617-ci-test-time-reduction-split" .claude/skills/aiworkflow-requirements/indexes .claude/skills/aiworkflow-requirements/references docs/30-workflows/LOGS.md` | registered references |
