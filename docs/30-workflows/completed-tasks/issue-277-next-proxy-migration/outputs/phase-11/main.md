# Phase 11 Main

Status: local implementation complete / runtime smoke pending.

`apps/web/middleware.ts` has been migrated to `apps/web/proxy.ts`, `apps/web/app/(admin)/layout.tsx` has the stale comment corrected, and `apps/web/__tests__/proxy.spec.ts` contains AC-1 through AC-7 coverage. Focused proxy Vitest passed, build output has no middleware deprecation warning, and dev-server curl redirect evidence was captured for logged-out profile/admin paths.

Authenticated browser smoke remains optional and credential-gated. For this NON_VISUAL task, screenshots are not required; Phase 11 evidence is command output, focused Vitest, build warning grep, and logged-out curl smoke.
