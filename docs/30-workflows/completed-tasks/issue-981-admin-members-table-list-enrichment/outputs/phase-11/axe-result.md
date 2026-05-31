# Phase 11 Axe Result

## Command

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx
```

## Result

PASS: `MembersTable.spec.tsx` 21 tests passed.

Relevant a11y assertions:

| Case | Result |
| --- | --- |
| existing baseline row `a11y violations 0` | PASS |
| TC-MT-13 full enrichment row | PASS |
| TC-MT-20 full + partial missing mixed rows | PASS |
