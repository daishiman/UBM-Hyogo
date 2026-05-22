# Phase 4 Test Strategy

Status: completed

## Scope

- Shared `PublicMemberProfileZ` accepts `attendance` and optional `attendanceMeta`.
- Repository builder injects public attendance through `attendanceProvider`.
- Public route returns attendance without adding session or admin guards.
- Public use-case returns attendance and fails fast when provider wiring is missing.

## Test Files

- `packages/shared/src/zod/viewmodel.test.ts`
- `apps/api/src/repository/__tests__/builder.test.ts`
- `apps/api/src/use-cases/public/__tests__/get-public-member-profile.test.ts`
- `apps/api/src/routes/public/index.test.ts`

## Evidence

- Runtime evidence: `outputs/phase-11/evidence/test.log`
- Result: PASS, 5 files / 66 tests
