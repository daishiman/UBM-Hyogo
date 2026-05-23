# Workflow Artifact Inventory: issue-277-next-proxy-migration

| Field | Value |
|---|---|
| workflow | `docs/30-workflows/issue-277-next-proxy-migration/` |
| status | `implemented_local / implementation / NON_VISUAL / runtime_evidence_pending` |
| source issue | #277 OPEN |
| parent workflow | `docs/30-workflows/completed-tasks/UT-06B-NEXT-PROXY-MIGRATION.md` |

## Implementation Targets

| Path | Role |
|---|---|
| `apps/web/middleware.ts` | Rename source; removed during implementation |
| `apps/web/proxy.ts` | Rename target; exports `proxy` |
| `apps/web/app/(admin)/layout.tsx` | Comment wording update from middleware to proxy |
| `apps/web/__tests__/proxy.spec.ts` | Focused AC-1〜AC-7 proxy parity tests |
| `apps/web/package.json` | Web coverage command includes `apps/web/proxy.ts` |
| `vitest.config.ts` | Root Vitest include covers `apps/**/__tests__` and coverage includes `apps/web/proxy.ts` |

## Evidence

| Path | Role |
|---|---|
| `docs/30-workflows/issue-277-next-proxy-migration/artifacts.json` | root workflow metadata |
| `docs/30-workflows/issue-277-next-proxy-migration/outputs/artifacts.json` | output metadata mirror |
| `docs/30-workflows/issue-277-next-proxy-migration/outputs/phase-12/phase12-task-spec-compliance-check.md` | strict 7 compliance |
| `docs/30-workflows/issue-277-next-proxy-migration/outputs/phase-11/` | pending focused command/build/dev-server runtime evidence after local implementation |

## User Gate

Implementation execution, manual smoke evidence, commit, push, PR creation, and Issue #277 close are user-gated. PR text must use `Refs #277`, not close keywords.
