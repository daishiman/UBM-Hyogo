# Phase 12 Main

Status: `implemented_local_evidence_captured / implementation / VISUAL`.

This wave implemented the Task A base rather than leaving the workflow as `spec_created`: `AuthView`, `resolveAuthView()`, `getAuthView()`, `PublicHeader` auth slot rendering, and `(public)/layout.tsx` authView injection are present in `apps/web`.

Verification:

| Gate | Result |
| --- | --- |
| focused Vitest | PASS: 24 tests |
| typecheck | PASS: `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| lint | PASS: `mise exec -- pnpm --filter @ubm-hyogo/web lint` |
| hardcoded HEX grep | PASS: 0 hits |
| Phase 11 local visual evidence | PASS: guest/member/admin screenshots present |
| commit / push / PR | pending_user_approval |

30-method compact evidence is summarized in `phase12-task-spec-compliance-check.md`.
