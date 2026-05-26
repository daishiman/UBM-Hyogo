# Issue #901 Authenticated Profile/Admin Staging Visual Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Workflow | `docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/` |
| Status | `spec_created / implementation / VISUAL / runtime_pending` |
| Source issue | #901 CLOSED (`Refs #901` only) |
| Source task | `docs/30-workflows/completed-tasks/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md` consumed |
| Parent | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/` |
| Parent gate | `VISUAL_RUNTIME_AUTHENTICATED_PENDING` |

## Workflow Artifacts

| Artifact | Purpose |
| --- | --- |
| `index.md` | Closed-issue recovery decision, current codebase optimization, and scope boundary. |
| `artifacts.json` | Gate metadata, runtime pending state, expected screenshots, and parent linkage. |
| `phase-01-requirements.md` .. `phase-13-commit-pr-draft.md` | Phase 1-13 executable specification. |
| `outputs/phase-11/main.md` | Phase 11 contract boundary for authenticated visual evidence. |
| `outputs/phase-11/screenshot-plan.json` | Two authenticated screenshot capture contract. |
| `outputs/phase-11/storagestate-generation.md` | Redaction-safe storageState generation procedure. |
| `outputs/phase-11/canonical-paths.json` | Canonical evidence paths for the Phase 11 validator. |
| `outputs/phase-12/*.md` | Strict Phase 12 output set. |

## Implementation Targets

| Target | Intended change |
| --- | --- |
| `apps/web/playwright/scripts/mint-staging-storage-state.ts` | Mint short-lived member/admin Auth.js session cookies via `signSessionJwt(secret, input)`. |
| `apps/web/playwright/tests/visual-staging-authenticated/*.spec.ts` | Capture authenticated `/profile` and `/admin` staging baselines. |
| `apps/web/playwright.config.ts` | Add setup/authenticated/teardown Playwright projects without disturbing existing `staging-visual`. |
| `apps/web/app/profile/page.tsx` | Add stable `data-testid="profile-authenticated-root"` if absent. |
| `apps/web/app/(admin)/admin/page.tsx` | Add stable `data-testid="admin-dashboard-root"` if absent. |
| `.github/workflows/playwright-staging-visual-authenticated.yml` | Run authenticated visual and auth-leak grep gates. |
| `apps/web/.gitignore` | Exclude ephemeral `playwright/.auth/` storageState outputs. |

## Boundary

No new API endpoint, D1 schema, Google Form contract, production deploy, Issue mutation, branch protection mutation, commit, push, or PR creation is part of this spec package. Authenticated baseline capture and parent gate release remain user-gated runtime steps.
