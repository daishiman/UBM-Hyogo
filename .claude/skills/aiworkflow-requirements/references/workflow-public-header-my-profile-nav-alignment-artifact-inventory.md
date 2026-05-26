# public-header-my-profile-nav-alignment Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| workflow_id | `public-header-my-profile-nav-alignment` |
| workflow root | `docs/30-workflows/completed-tasks/public-header-my-profile-nav-alignment/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / browser_smoke_pending_user_gate` |
| created_at | 2026-05-26 |
| parent workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |
| implementation boundary | public header my-page CTA alignment; no API, D1 schema, OAuth provider, primitive API, or visual token change |

## Current Canonical Artifacts

| Artifact | Path | Status |
| --- | --- | --- |
| workflow index | `docs/30-workflows/completed-tasks/public-header-my-profile-nav-alignment/index.md` | present |
| root metadata | `docs/30-workflows/completed-tasks/public-header-my-profile-nav-alignment/artifacts.json` | present |
| outputs metadata | `docs/30-workflows/completed-tasks/public-header-my-profile-nav-alignment/outputs/artifacts.json` | present / parity with root |
| Phase 1-13 specs | `docs/30-workflows/completed-tasks/public-header-my-profile-nav-alignment/outputs/phase-{1..13}/phase-{1..13}.md` | present |
| Phase 11 VISUAL_ON_EXECUTION evidence | `docs/30-workflows/completed-tasks/public-header-my-profile-nav-alignment/outputs/phase-11/` | present; browser screenshots pending user gate |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/public-header-my-profile-nav-alignment/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | present |

## Implementation Targets

| Area | Implemented files |
| --- | --- |
| Public header | `apps/web/src/components/public/PublicHeader.tsx` |
| Pathname island | `apps/web/src/components/public/PublicHeaderWithPath.tsx` |
| Session wrapper | `apps/web/src/components/public/SessionAwarePublicHeader.tsx` |
| Wiring | `apps/web/app/(public)/layout.tsx`, `apps/web/app/page.tsx` |
| Tests | `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx`, `apps/web/src/components/public/__tests__/SessionAwarePublicHeader.spec.tsx`, `apps/web/app/(public)/layout.spec.tsx` |

## Contract Summary

| Contract | Value |
| --- | --- |
| authenticated header action | right-side CTA links to `/profile` with `data-state="authenticated"` |
| anonymous header action | right-side CTA links to `/login` with `data-state="anonymous"` |
| pathname ownership | `PublicHeaderWithPath` uses `usePathname()` and passes `currentPath` to `PublicHeader` |
| session ownership | `SessionAwarePublicHeader` uses `getSession()` and maps only `{ memberId, name? }` to `currentUser` |
| forbidden | duplicate `/profile` nav+CTA labels, D1 direct access from web, direct env access, new API endpoint, HEX color literals |

## Evidence Boundary

Focused local unit coverage is captured for presentational rendering, session mapping, and layout shell mocking. Browser/session smoke, commit, push, and PR remain user-gated.

## Same-Wave Sync

| Target | Status |
| --- | --- |
| `indexes/quick-reference.md` | synced |
| `indexes/resource-map.md` | synced |
| `references/task-workflow-active.md` | synced |
| `SKILL-changelog.md` | synced |
| `LOGS/_legacy.md` | synced |
| `task-specification-creator/references/patterns-lessons-and-pitfalls.md` | synced |
