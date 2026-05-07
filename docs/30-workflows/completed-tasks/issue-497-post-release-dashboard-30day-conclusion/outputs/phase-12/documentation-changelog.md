# Documentation Changelog

Skill changelog fragment:

- `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md`

Skill lessons-learned fragment:

- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-497-post-release-dashboard-30day-conclusion-2026-05.md`（L-497-001..004）

Skill references updates:

- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` §30 day schedule feedback contract
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（Issue #497 active route）
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-351-09c-post-release-dashboard-automation-artifact-inventory.md`（follow-up trace）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md` 変更履歴行

Workflow-local close-out:

| Date | Workflow | Workflow state | PR ref policy |
| --- | --- | --- | --- |
| 2026-05-06 | issue-497-post-release-dashboard-30day-conclusion | spec_created / docs-only / NON_VISUAL / external-time-dependent / formalized contract | Issue #497 CLOSED 維持。再 OPEN しない。PR 文面は `Refs #497, Refs #351` |

Same-cycle parent (#351) hardening recorded under Step 1-A2 of `system-spec-update-summary.md`:

| File | Change |
| --- | --- |
| `scripts/post-release-dashboard/lib/redaction-check.sh` | `redaction-check.md` artifact 出力（PASS/FAIL summary、機微行は転記しない） |
| `scripts/post-release-dashboard/__tests__/redaction-check.test.sh` | PASS/FAIL 報告ファイル生成を検証 |
| `.github/workflows/ci.yml` | `pnpm post-release-dashboard:test` を CI に組み込み |
