# Workflow Artifact Inventory: Issue #256 E2E Coverage Baseline Runbook

## Canonical Workflow

| Workflow | Status | Evidence |
| --- | --- | --- |
| `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/` | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` | `scripts/measure-coverage-exclude-ratio.ts`, `.github/workflows/verify-coverage-exclude-ratio.yml`, `vitest.config.ts`, runbooks, Phase 7 baseline (`37 / 80 = 46.3% warn`), Phase 9 QA evidence, Phase 11 NON_VISUAL evidence, Phase 12 strict 7 |

## Canonical Paths

| Category | Path |
| --- | --- |
| Workflow root | `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/` |
| Root artifacts | `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/artifacts.json` |
| Output artifacts mirror | `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/artifacts.json` |
| Phase 7 baseline | `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-7/{coverage-exclude-ratio.json,coverage-exclude-ratio.md}` |
| Phase 9 QA evidence | `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-9/qa-result.md` |
| Phase 11 NON_VISUAL evidence | `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-11/manual-test-result.md` |
| Phase 12 strict 7 | `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-12/` |
| Phase 12 compliance check | `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Consumed source task | `docs/30-workflows/unassigned-task/task-e2e-playwright-coverage-001.md` (status: `partial_fix`) |

## Implementation Targets

| Path | Role |
| --- | --- |
| `scripts/measure-coverage-exclude-ratio.ts` | Coverage exclude ratio measurement |
| `scripts/__tests__/measure-coverage-exclude-ratio.spec.ts` | Unit coverage for measurement logic |
| `.github/workflows/verify-coverage-exclude-ratio.yml` | PR soft warning |
| `vitest.config.ts` | Current `apps/web/app` coverage topology |
| `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md` | Ratio warn interpretation |
| `docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md` | Smoke SLA and route inventory |
| `.claude/skills/aiworkflow-requirements/SKILL.md` / `SKILL-changelog.md` | Same-wave skill history |

## Classification

- Implementation category: `implementation / NON_VISUAL`
- Issue lifecycle: Issue #256 CLOSED; references use `Refs #256` only (`Closes/Fixes/Resolves` forbidden per compliance-check)
- Release shape: initial release with `verify-coverage-exclude-ratio` as soft warn (required-check promotion deferred — see Consumed Trace)

## Runtime Boundary

- All CI / branch protection mutations are user-gated; this workflow only ships local evidence and a soft-warn workflow file
- `Refs #256` only on PR (no auto-close)
- Baseline `37 / 80 = 46.3% warn` is recorded but not auto-promoted to a hard gate

## Consumed / Superseded Trace

- Parent unassigned task `task-e2e-playwright-coverage-001.md` moved to `partial_fix` with 2026-05-18 backlink to this workflow
- Phase 10 MINOR candidates (3) intentionally not promoted to new unassigned tasks; dispositions are formalized in `outputs/phase-12/unassigned-task-detection.md`
- `verify-coverage-exclude-ratio` required-check promotion trigger: re-evaluate after one CI cycle of post-merge observation; promotion requires user-approved `gh api -X PUT` against branch protection

## Lessons Learned

- No dedicated `lessons-learned/*.md` was created (Phase 9 QA and Phase 10 final-review showed no notable struggle points; AC-1〜AC-5 were straight-through)
- Design note worth preserving: the coverage denominator was corrected to production-like app source (test specs excluded) — this is captured in `SKILL.md` / `SKILL-changelog.md` (v2026.05.18) without a separate lessons file
