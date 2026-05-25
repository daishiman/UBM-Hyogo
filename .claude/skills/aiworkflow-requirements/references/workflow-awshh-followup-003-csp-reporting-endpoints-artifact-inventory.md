# awshh-followup-003-csp-reporting-endpoints Artifact Inventory

## Workflow Root

| Artifact | Path |
| --- | --- |
| index | `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/index.md` |
| root artifacts | `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation

| Artifact | Path |
| --- | --- |
| security header builder | `apps/web/src/lib/security-headers.ts` |
| env public subset | `apps/web/src/lib/env.ts` |
| middleware integration | `apps/web/middleware.ts` |
| security header unit tests | `apps/web/src/lib/security-headers.spec.ts` |
| env unit tests | `apps/web/src/lib/__tests__/env.spec.ts` |

## Phase Outputs

| Artifact | Path |
| --- | --- |
| Phase 1-13 specs | `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/phase-01.md` ... `phase-13.md` |
| Phase 1-13 output summaries | `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/outputs/phase-01/main.md` ... `outputs/phase-13/main.md` |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/outputs/phase-12/` |

## System Spec Sync

| Artifact | Path |
| --- | --- |
| quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` |
| resource map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` |
| active workflow | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| web response security headers | `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` |
| lessons learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-awshh-followup-003-csp-reporting-endpoints-2026-05.md` |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260524-awshh-followup-003-csp-reporting-endpoints.md` |

## Consumed Source

| Artifact | Path |
| --- | --- |
| source placeholder | `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-003-reporting-endpoints.md` |

## Boundary

`apps/api`, D1 migrations, and `apps/web/wrangler.toml` are unchanged. Staging deploy, Sentry receive verification, commit, push, and PR are user-gated.
