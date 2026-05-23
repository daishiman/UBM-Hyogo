# Documentation changelog

## Entry checklist

| Check | Command | Result |
| --- | --- | --- |
| apps/packages dirty diff | `git status --porcelain apps/ packages/ 2>/dev/null` | exit 0, output 0 lines; no apps/packages dirty diff |
| workflow count | `find .github/workflows -maxdepth 1 -name '*.yml' -type f \| wc -l` | exit 0, count 32 |
| yaml count | `find .github/workflows -maxdepth 1 -name '*.yaml' -type f \| wc -l` | exit 0, count 0 |

## Changed paths

| Category | Paths |
| --- | --- |
| workflow spec | `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/{index.md,phase-01.md..phase-13.md,artifacts.json}` |
| workflow outputs | `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/{artifacts.json,phase-02/yamllint-decision.md,phase-08/static-check-log.md,phase-10/go-no-go.md,phase-11/smoke-log.md,phase-11/canonical-paths.json,phase-12/*.md}` |
| runbook | `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` |
| source task | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-workflow-lint-gate.md` |
| aiworkflow skill正本 | `.claude/skills/aiworkflow-requirements/SKILL.md` |
| aiworkflow skill履歴 | `.claude/skills/aiworkflow-requirements/SKILL-changelog.md`, `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`, `.claude/skills/aiworkflow-requirements/changelog/20260517-issue290-workflow-lint-gate.md` |
| aiworkflow references | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`, `task-workflow-active.md`, `workflow-issue-290-workflow-lint-gate-artifact-inventory.md`, `lessons-learned-issue-290-workflow-lint-gate-2026-05.md`, `lessons-learned.md` |
| aiworkflow indexes | `.claude/skills/aiworkflow-requirements/indexes/{quick-reference.md,resource-map.md,topic-map.md,keywords.json}` |
| system specs under `docs/00-getting-started-manual/specs/` | 該当なし: workflow lint gate は GHA deployment invariant のみを変更 |

## Validator execution log

| Command | Exit code | Count / output |
| --- | --- | --- |
| `pnpm observation:lint` | 0 | shell unit `PASS=13 FAIL=0`; actionlint all workflows completed |
| `find .github/workflows -maxdepth 1 -name '*.yml' -type f \| wc -l` | 0 | 32 |
| `find .github/workflows -maxdepth 1 -name '*.yaml' -type f \| wc -l` | 0 | 0 |
| `cmp -s docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/artifacts.json docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/artifacts.json` | 0 | root/output artifacts parity OK |
| `find docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-12 -maxdepth 1 -type f \| sort` | 0 | 8 files including strict 7 |
| `node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js --workflow docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate --check-existence` | 0 after remediation | canonical manifest valid |
| `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate` | 0 after remediation | 12/12 checks |
| `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | 0 | regenerated `topic-map.md` and `keywords.json` |
| `node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js --target-file docs/30-workflows/completed-tasks/ut-cicd-drift-impl-workflow-lint-gate.md --json` | 0 after remediation | current target violations 0 |

## 2026-05-17 changes

| Area | Change |
| --- | --- |
| workflow spec | Added Issue #290 Phase 1-13 workflow root and Phase 12 strict outputs |
| runbook | Added workflow lint local recovery runbook |
| decision | Added yamllint non-adoption decision |
| aiworkflow requirements | Updated deployment GHA invariant, quick-reference, resource-map, topic-map, keywords, task-workflow-active, artifact inventory, lessons, changelog, LOGS, and SKILL history |
| source task | Marked UT-CICD-DRIFT workflow lint unassigned task as consumed and closed AC checkboxes |

## Current / baseline separation

Current diff is compliant after remediation. Repository-wide historical unassigned baseline is not claimed as clean; only the touched source task is audited as current scope.
