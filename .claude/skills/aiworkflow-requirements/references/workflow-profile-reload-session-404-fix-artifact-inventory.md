# Workflow Artifact Inventory: profile-reload-session-404-fix

## Canonical

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/profile-reload-session-404-fix/` |
| root artifacts | `docs/30-workflows/profile-reload-session-404-fix/artifacts.json` |
| output artifacts | `docs/30-workflows/profile-reload-session-404-fix/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/profile-reload-session-404-fix/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/profile-reload-session-404-fix/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## State

`implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`

## Implemented Local Targets

- `apps/api/src/middleware/trailing-slash.ts`
- `apps/api/src/index.ts`
- `apps/web/app/api/me/[...path]/route.ts`
- `apps/web/app/(member)/profile/page.tsx`
- `apps/web/src/components/member/SectionError.tsx`

## Tests

- `apps/api/src/middleware/__tests__/trailing-slash.spec.ts`
- `apps/api/src/__tests__/me-route-mount.integration.spec.ts`
- `apps/web/app/api/me/[...path]/route.route.spec.ts`
- `apps/web/app/(member)/profile/page.spec.tsx`
- `apps/web/src/components/member/__tests__/SectionError.spec.tsx`

## Verification Boundary

Focused local Vitest evidence is present:

- API: `pnpm exec vitest run apps/api/src/middleware/__tests__/trailing-slash.spec.ts apps/api/src/__tests__/me-route-mount.integration.spec.ts` PASS (2 files / 9 tests)
- Web: `pnpm exec vitest run 'apps/web/app/api/me/[...path]/route.route.spec.ts' 'apps/web/app/(member)/profile/page.spec.tsx' apps/web/src/components/member/__tests__/SectionError.spec.tsx` PASS (3 files / 16 tests)

Staging authenticated `/profile` screenshot, commit, push, and PR remain user-gated. `/me` response shape, D1 schema, Google Form schema, and memberId URL exposure are unchanged.

## Notes

- Route-level 404 cause is closed by global trailing-slash 308 normalization before Hono route matching.
- Web BFF proxy no longer constructs `/me/` for empty catch-all path.
- `/profile` maps `MEMBER_SESSION_404` to a re-login CTA and stops exposing raw `fetchAuthed failed: NNN` messages for `/me` failures.
