# Artifact Inventory — issue-1029-public-member-photo-display

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/` |
| root index | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/index.md` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/artifacts.json` |
| Phase 11 boundary | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| public exposure policy | `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md` |

## State

`implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION`.

## Implemented Targets

| Area | Targets |
| --- | --- |
| shared | `packages/shared/src/zod/viewmodel.ts`, `packages/shared/src/types/viewmodel/index.ts` |
| API repository | `apps/api/src/repository/memberPhotos.ts` |
| API routes/use-cases | `apps/api/src/routes/public/members.ts`, `apps/api/src/routes/public/member-profile.ts`, `apps/api/src/use-cases/public/list-public-members.ts`, `apps/api/src/use-cases/public/get-public-member-profile.ts` |
| API view-models | `apps/api/src/view-models/public/public-member-list-view.ts`, `apps/api/src/view-models/public/public-member-profile-view.ts` |
| web UI | `apps/web/src/components/public/MemberCard.tsx`, `apps/web/src/components/public/ProfileHero.tsx`, `apps/web/src/components/public/MemberDetail.tsx`, `apps/web/src/lib/adapters/member-detail.ts` |
| tests | schema optional/strict parse, `listMemberPhotosByIds`, public list/profile resolver matrix, public route contract, MemberCard/ProfileHero render tests |

## Evidence

| Item | Path |
| --- | --- |
| focused Vitest | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/focused-vitest.log` |
| public route contract | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/public-route-contract.log` |
| shared typecheck | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/shared-typecheck.log` |
| API typecheck | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/api-typecheck.log` |
| web typecheck | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/web-typecheck.log` |
| shared lint | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/shared-lint.log` |
| API lint | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/api-lint.log` |
| web lint | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/web-lint.log` |
| web R2 boundary grep | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/web-r2-boundary-grep.log` |
| Playwright public photo | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/playwright-public-photo.log` |
| Phase 12 verifier | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/phase12-compliance-verify.log` |
| TODO/skip scoped scan | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/evidence/todo-skip-scan.log` |
| list desktop screenshot | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/screenshots/public-members-photo-list-desktop.png` |
| detail desktop screenshot | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/screenshots/public-member-photo-detail-desktop.png` |
| list mobile screenshot | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/outputs/phase-11/screenshots/public-members-photo-list-mobile.png` |

## Boundary

The workflow reuses #983 `member_photos`, private R2 `MEMBER_PHOTOS`, `presignMemberPhotoGetUrl`, and `Avatar src/onError`. It adds no D1 migration and no photo-specific consent column. Local Playwright screenshots are captured with a public-safe mock `photoUrl`. Staging deploy, R2 secret injection, real R2 URL capture, commit, push, PR, and Issue #1029 mutation remain user-gated.
