# Phase 9 Output: QA Result

## Verification Commands

```bash
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/api lint
pnpm exec vitest run apps/api/src/middleware/__tests__/security-headers.spec.ts
pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/public/index.contract.spec.ts
```

## Result

- Typecheck: passed
- Lint: passed
- Focused middleware tests: passed, 15 tests
- Public contract regression: passed, 9 tests

## Notes

The D1 contract test emitted expected application stderr for negative-path cases while still passing.
