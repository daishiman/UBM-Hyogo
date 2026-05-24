# apps-web-security-headers-hardening Artifact Inventory

## Workflow Root

| Artifact | Path |
| --- | --- |
| index | `docs/30-workflows/apps-web-security-headers-hardening/index.md` |
| root artifacts | `docs/30-workflows/apps-web-security-headers-hardening/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/apps-web-security-headers-hardening/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/apps-web-security-headers-hardening/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation

| Artifact | Path |
| --- | --- |
| security header builder | `apps/web/src/lib/security-headers.ts` |
| unit tests | `apps/web/src/lib/security-headers.spec.ts` |
| middleware integration | `apps/web/middleware.ts` |
| Playwright smoke | `apps/web/playwright/tests/security-headers.spec.ts` |

## System Spec Sync

| Artifact | Path |
| --- | --- |
| quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` |
| resource map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` |
| active workflow | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| web response security headers | `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` |
| OpenNext Workers deployment | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` |
| lessons learned (L-AWSHH-001..004) | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-apps-web-security-headers-hardening-2026-05.md` |

## Boundary

Staging/production response verification, commit, push, and PR are user-gated.
