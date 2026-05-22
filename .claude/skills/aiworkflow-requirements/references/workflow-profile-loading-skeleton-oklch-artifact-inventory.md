# workflow-profile-loading-skeleton-oklch-artifact-inventory

| Artifact | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/profile-loading-skeleton-oklch/` |
| root artifacts | `docs/30-workflows/completed-tasks/profile-loading-skeleton-oklch/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/profile-loading-skeleton-oklch/outputs/artifacts.json` |
| implementation | `apps/web/app/profile/loading.tsx` |
| tests (component) | `apps/web/app/profile/loading.spec.tsx` |
| tests (visual) | `apps/web/playwright/tests/visual/profile-loading-skeleton.spec.ts` |
| visual harness route | `apps/web/app/visual-harness/[name]/page.tsx` (allowed name `profile-loading`) |
| playwright config | `apps/web/playwright.config.ts` (`visual-chromium` project matches `visual/*.spec.ts`) |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/profile-loading-skeleton-oklch/outputs/phase-11/evidence/` |
| Phase 11 screenshot | `docs/30-workflows/completed-tasks/profile-loading-skeleton-oklch/outputs/phase-11/screenshots/profile-loading-skeleton.png` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/profile-loading-skeleton-oklch/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md` |
| consumed task | `docs/30-workflows/completed-tasks/integration-fixes-i07-profile-loading-skeleton.md` |

## Boundary

No API endpoint, D1 schema, Auth.js, Google Form, or Cloudflare binding changes. Commit, push, and PR remain user-gated.
