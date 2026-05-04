# Phase 2 Replacement Design

## Result

The implementation uses `STABLE_KEY` from `@ubm-hyogo/shared` as the canonical stableKey reference surface.

Design decisions:

- `packages/shared/src/zod/field.ts` owns `FieldByStableKeyZ`, `STABLE_KEY_LIST`, and `STABLE_KEY`.
- Application code imports `STABLE_KEY` instead of repeating stableKey string literals.
- DB column names that happen to equal stableKey names remain value-compatible, but the intent is canonical key reuse for stableKey-bearing paths rather than a new DB schema contract.

