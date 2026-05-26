# Phase 12 — Implementation Guide

## Part 1: Concept

The staging visual job now knows about two more public pages: the member list and one member detail page. The list page can always be discovered. The detail page needs a stable member id, so the test safely skips unless `PLAYWRIGHT_MEMBER_DETAIL_ID` is provided.

## Part 2: Technical Notes

The new specs follow the existing `visual-staging` pattern:

- Use the `staging-visual` Playwright project and its staging `baseURL`.
- Keep SSR data sourced from the real staging Worker.
- Disable animation and transition noise before screenshot assertions.
- Use `maxDiffPixelRatio: 0.05`, matching the existing staging baselines.

The GitHub Actions workflow now accepts `staging_visual_member_detail_id` on `workflow_dispatch` and exports it as `PLAYWRIGHT_MEMBER_DETAIL_ID`.

Runtime reports and failure artifacts are written to this workflow root:

- `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/outputs/phase-11/evidence/test-results`

After CI baseline generation, copy the two ubuntu-latest screenshots into both the Playwright snapshot directories and this workflow's Phase 11 evidence directory:

- `apps/web/playwright/tests/visual-staging/members-list.spec.ts-snapshots/members-list-staging-visual-chromium-linux.png`
- `apps/web/playwright/tests/visual-staging/member-detail.spec.ts-snapshots/member-detail-staging-visual-chromium-linux.png`
- `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/outputs/phase-11/evidence/members-list-staging-visual-chromium-linux.png`
- `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/outputs/phase-11/evidence/member-detail-staging-visual-chromium-linux.png`
