# Allow-List Spec

Status: COMPLETED (enforced_dry_run review baseline).

Required source-of-truth modules:

- `packages/shared/src/zod/field.ts`
- `packages/integrations/google/src/forms/mapper.ts`

Candidate modules to verify before implementation:

- `packages/shared/src/zod/section.ts`
- `packages/integrations/google/src/forms/schema.ts`

Exception globs:

- `**/*.test.ts`
- `**/*.test.tsx`
- `**/__fixtures__/**`
- `**/__tests__/**`
- `**/migrations/seed/**`
- `docs/**`

Implementation rule: keep exceptions auditable in configuration. Inline `eslint-disable` baseline must remain 0.
