# Issue #902 Members Staging Visual Baseline Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Workflow | `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/` |
| Status | `implemented_local_runtime_pending / implementation / VISUAL` |
| Source issue | #902 CLOSED (`Refs #902` only) |
| Source task | `docs/30-workflows/completed-tasks/UT-DSF-07-FU-02-members-list-detail-staging-visual.md` consumed |
| Parent | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/` |

## Implementation Targets

| Target | Change |
| --- | --- |
| `apps/web/playwright/tests/visual-staging/members-list.spec.ts` | Adds `/members` initial-view staging visual baseline spec. |
| `apps/web/playwright/tests/visual-staging/member-detail.spec.ts` | Adds env-gated `/members/[id]` staging visual baseline spec. |
| `.github/workflows/playwright-smoke.yml` | Updates staging visual wording to 6 screens and adds `staging_visual_member_detail_id` workflow input. |

## Evidence

| Artifact | Status |
| --- | --- |
| `outputs/phase-11/evidence/playwright-list-staging-visual.txt` | present: 6 tests listed. |
| `outputs/phase-11/evidence/typecheck.log` | present: focused web typecheck. |
| `outputs/phase-11/evidence/*-staging-visual-chromium-linux.png` | pending runtime CI baseline generation. |

## Boundary

No API endpoint, D1 schema, Google Form contract, app source runtime contract, or production deploy changed. Staging deploy verification, baseline PNG generation, commit, push, and PR remain user-gated.

