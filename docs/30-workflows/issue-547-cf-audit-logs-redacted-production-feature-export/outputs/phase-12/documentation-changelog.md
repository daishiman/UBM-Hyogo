# Documentation Changelog

## Summary

| Date | Change | Validator / evidence |
| --- | --- | --- |
| 2026-05-08 | Implemented Issue #547 redacted feature export CLI, schema validation, manifest, D1 read boundary, tests, fixture evidence, and same-wave SSOT sync. | Phase 11 logs under `outputs/phase-11/` |
| 2026-05-08 | Split fixture and production Phase 11 evidence to prevent false green runtime status. | `outputs/phase-11/production-pending-user-gate.md` |
| 2026-05-08 | Fixed Phase 12 close-out to require AC / evidence / SSOT / parity checks, not only file existence. | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Updated Files

| Scope | Path | Notes |
| --- | --- | --- |
| workflow root | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/` | Active root retained because Phase 13 remains blocked pending user approval. |
| runbook | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Added production feature export command and evidence hygiene. |
| source follow-up | `docs/30-workflows/completed-tasks/issue-515-redacted-feature-export.md` | Marked consumed by Issue #547 implementation. |
| aiworkflow SSOT | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Added feature export contract. |
| aiworkflow workflow | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active Issue #547 status and user gate. |
| aiworkflow lessons | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-547-cf-audit-logs-redacted-production-feature-export-2026-05.md` | Added苦戦箇所 and 5-minute resolution cards. |
| aiworkflow inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-547-cf-audit-logs-redacted-production-feature-export-artifact-inventory.md` | Added artifact ledger. |
| aiworkflow changelog/logs | `.claude/skills/aiworkflow-requirements/changelog/20260508-issue547-redacted-feature-export.md`, `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`, `docs/30-workflows/LOGS.md` | Added same-wave records. |
| indexes | `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map}.md`, `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | Regenerated after SSOT edits. |
| task-spec skill | `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`, `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md`, `.claude/skills/task-specification-creator/references/phase-12-spec.md`, `.claude/skills/task-specification-creator/SKILL-changelog.md`, `.claude/skills/task-specification-creator/LOGS/_legacy.md` | Promoted reusable Phase 12 lessons. |
| skill-creator | `.claude/skills/skill-creator/references/update-process.md`, `.claude/skills/skill-creator/LOGS/_legacy.md` | Clarified no-op routing evidence. |

## Current / Baseline Split

| Item | Result |
| --- | --- |
| current implementation | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` with local fixture/typecheck/lint/focused test evidence. |
| production runtime | `PENDING_RUNTIME_EVIDENCE`; not executed without user approval. |
| artifact parity | `cmp -s artifacts.json outputs/artifacts.json` expected exit `0`. |
| broader baseline | Existing unrelated workflow deletions and line-budget issues are not part of Issue #547 scope. |
