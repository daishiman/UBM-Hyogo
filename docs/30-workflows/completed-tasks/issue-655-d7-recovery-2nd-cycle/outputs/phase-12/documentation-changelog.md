# Documentation Changelog — issue-655-d7-recovery-2nd-cycle

## Entry Checklist

```bash
git status --porcelain apps/ packages/ 2>/dev/null
```

Result: no `apps/` or `packages/` dirty diff is introduced by this close-out.

```bash
git diff --name-only main...HEAD -- 'apps/**' 'packages/**'
```

Result: no `apps/` or `packages/` dirty diff. This task changes workflow YAML,
scripts, runbook, workflow specs, and aiworkflow requirements; it is classified
as `implemented-local-runtime-pending`.

## Changed Workflow Files

| Path | Status |
| --- | --- |
| `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/artifacts.json` | added |
| `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/outputs/artifacts.json` | added |
| `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/outputs/phase-11/main.md` | added |
| `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/outputs/phase-11/canonical-paths.json` | added |
| `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/outputs/phase-11/evidence/*.RUNTIME_PENDING_USER_APPROVAL.md` | added |
| `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/outputs/phase-11/evidence/recovery-rootcause.md` | added with read-only GitHub Actions blocker evidence |
| `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/outputs/phase-12/*.md` | added |
| `.github/workflows/cf-audit-log-7day-summary.yml` | updated |
| `scripts/cf-audit-log/observation/post-switch-monitor.ts` | updated |
| `scripts/cf-audit-log/observation/recovery-rootcause-helper.ts` | added |
| `scripts/cf-audit-log/observation/__tests__/post-switch-monitor.recovery.spec.ts` | added |
| `scripts/cf-audit-log/observation/__tests__/recovery-rootcause-helper.spec.ts` | added |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | updated |

## Changed aiworkflow Files

| Path | Status |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-655-d7-recovery-2nd-cycle-artifact-inventory.md` | added |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | updated |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | updated |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | updated |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | updated |

## Skill Files

| Category | Status |
| --- | --- |
| skill canonical file | `.claude/skills/task-specification-creator/SKILL.md` updated |
| skill history ledger | `.claude/skills/task-specification-creator/SKILL-changelog.md` updated |
| skill reference/template | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` updated: recovery workflows must generate normal evidence in recovery mode and must apply `since` to actual window filtering |

## Validator Records

| Command | Expected result |
| --- | --- |
| `pnpm verify:phase12-compliance` | exit 0 after strict 7 creation |
| `node node_modules/vitest/vitest.mjs run scripts/cf-audit-log/observation/__tests__/post-switch-monitor.recovery.spec.ts scripts/cf-audit-log/observation/__tests__/recovery-rootcause-helper.spec.ts` | exit 0 |
| `test -f docs/30-workflows/issue-655-d7-recovery-2nd-cycle/artifacts.json` | exit 0 |
| `find docs/30-workflows/issue-655-d7-recovery-2nd-cycle/outputs/phase-12 -maxdepth 1 -type f | sort` | 7 files |
