# Phase 13 PR Summary — issue-769-root-error-focus

## Status

Blocked pending explicit user approval for commit / push / PR creation.

## Draft PR Title

`feat(issue-769): root error.tsx h1 auto-focus for screen reader`

## Summary

- Adds h1 focus transfer to `apps/web/app/error.tsx`.
- Adds TC-U-09a/b/c to `apps/web/app/__tests__/error.component.spec.tsx`.
- Adds workflow artifacts, Phase 11/12 evidence files, and aiworkflow-requirements registration.

## Verification Required Before PR

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error.component
```
