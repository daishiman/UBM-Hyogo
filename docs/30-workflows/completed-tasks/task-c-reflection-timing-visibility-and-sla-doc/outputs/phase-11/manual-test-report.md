# Manual Test Report

## Summary

Local static verification is complete. Runtime screenshots are pending explicit user approval because `/profile` requires an authenticated session.

## Results

| Surface | Verification | Result |
| --- | --- | --- |
| `/members` | `ReflectionTimingNote` placement and copy covered by focused component assertions and source wiring | PASS |
| `/profile` | profile copy / fallback behavior covered by focused component assertions and source wiring | PASS |
| screenshots | runtime capture | pending user approval |

## Commands

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx
```
