# Implementation Guide

## Summary

Mounted `ToastProvider` in `apps/web/app/layout.tsx` so `useAdminMutation` can resolve toast context through `useOptionalToast()`.

## Files Changed

| Path | Change |
| --- | --- |
| `apps/web/app/layout.tsx` | Added `ToastProvider` import and wrapped root `children`. |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/*` | Marked i01 / p-08 DoD complete. |
| `.claude/skills/aiworkflow-requirements/*` | Added workflow sync references. |

## Verification

Run:

```bash
pnpm typecheck
pnpm lint
pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation
pnpm -F "@ubm-hyogo/web" build
```

Runtime admin toast visual smoke remains a user-session gate.

