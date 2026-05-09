# System Spec Update Summary

| Area | Update |
| --- | --- |
| Build contract | `apps/web` production build uses `next build --webpack` for OpenNext Workers compatibility |
| Test executability | admin audit page helper was moved out of `page.tsx` to satisfy Next App Router page export constraints during current typecheck |
| Runtime boundary | staging / production deploy evidence is user-gated and remains pending |
| SSOT | `CLAUDE.md`, overview spec, aiworkflow quick-reference/resource-map/task-workflow-active, artifact inventory, lessons, changelog |
| Non-goals | D1 schema, API DTOs, Auth.js semantic config, Cloudflare service bindings, CI/CD workflow topology |

The same-wave sync keeps implementation status as `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`: local evidence is green, runtime Cloudflare evidence is intentionally pending approval.

## Step 1-A: Task Completion Record

| Target | Result |
| --- | --- |
| `CLAUDE.md` | Added `apps/web` production build contract: `next build --webpack` for OpenNext Workers compatibility |
| `docs/00-getting-started-manual/specs/00-overview.md` | Added production build row for `apps/web` |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added workflow quick reference |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added workflow resource-map row |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow state |
| `.claude/skills/aiworkflow-requirements/references/workflow-web-app-route-bundle-parse-fix-artifact-inventory.md` | Added artifact inventory |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-web-app-route-bundle-parse-fix-2026-05.md` | Added lessons |
| `.claude/skills/aiworkflow-requirements/changelog/20260509-web-app-route-bundle-parse-fix.md` | Added changelog fragment |

`LOGS.md` is not present in the current `aiworkflow-requirements` skill tree. This wave uses the existing changelog fragment convention at `.claude/skills/aiworkflow-requirements/changelog/20260509-web-app-route-bundle-parse-fix.md`.

## Step 1-B: Implementation State

| Layer | State |
| --- | --- |
| workflow root | `implemented-local` |
| implementation status | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| Phase 11 local evidence | captured |
| staging / production runtime evidence | pending explicit user approval |
| Phase 13 | blocked pending user approval for commit / push / PR |

## Step 1-C: Related Task Update

No new related task is required for this workflow. Existing OpenNext Workers cutover work remains separate; this task only fixes the build output used by the current OpenNext Workers bundle.

## Step 1-H: Skill Feedback Routing

| Feedback item | Promotion target | Result |
| --- | --- | --- |
| OpenNext build evidence must include Worker bundle grep | `task-specification-creator` future Phase 11 guidance | Captured in `skill-feedback-report.md`; no same-wave template edit because current owning skill already has Phase 11 evidence path and this is an applied example rather than a structural rule |
| Phase path drift should be grep-gated | `task-specification-creator` future validation checklist | Captured in `skill-feedback-report.md`; current workflow paths normalized |
| Builder default drift should be a root-cause hypothesis | `aiworkflow-requirements` lessons | Promoted same-wave to lessons file and indexes |

## Step 2: Conditional System Spec Update

**判定: 更新あり**

This task changes the production build contract for `apps/web`, so Step 2 is not N/A even though API DTOs, D1 schema, and TypeScript interfaces are unchanged. The updated system-level contract is:

- `apps/web` production build uses `next build --webpack`.
- Turbopack remains local-development-only until Next/OpenNext release evidence proves Worker bundle compatibility for App Route Handlers.
- Runtime deployment and smoke evidence are user-gated and must not be represented as completed runtime PASS in Phase 11/12.
- Next App Router page modules must not export arbitrary helper functions; helpers used by tests belong in sibling modules.

## Artifacts Parity

`artifacts.json` and `outputs/artifacts.json` are both present and identical. Verified with:

```bash
cmp -s docs/30-workflows/web-app-route-bundle-parse-fix/artifacts.json docs/30-workflows/web-app-route-bundle-parse-fix/outputs/artifacts.json
# exit 0
```

## Adjacent Dirty Diff Boundary

Review detected unrelated deletions under:

- `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/`
- `docs/30-workflows/issue-548-ml-model-selection/`

Those paths are not owned by `web-app-route-bundle-parse-fix`, but active SSOT still cites them as canonical workflow roots. They were restored in this cycle to keep branch-level dependency integrity. Verification:

```bash
git diff --diff-filter=D --name-only -- docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export docs/30-workflows/issue-548-ml-model-selection
# 0 paths
```
