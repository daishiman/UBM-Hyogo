# Phase 4 — Test Plan

## 1. Unit / Component

| Task | Test target | Required assertions |
| --- | --- | --- |
| A | `resolveAuthView.spec.ts`, `PublicHeader.spec.tsx` | guest/member/admin/fail-closed, `data-auth-state`, `auth-cta`, `member-cta`, `admin-cta`, active nav retention |
| B | `app/__tests__/page.spec.tsx` | root `/` passes mocked `authView` into async `PublicHeader` |
| C | privacy / terms page specs | public shell, header, footer, legal h1, metadata unchanged |
| D | `safeNext.spec.ts`, login page spec | open redirect rejection, logged-in redirect, guest regression |
| E | `MemberHeader.spec.tsx` | admin link only for admin, sign-out retained |
| F | `AdminSidebar.spec.tsx` and/or `AdminSidebar.component.spec.tsx` | single public-return link, existing nav regression |

## 2. E2E

`apps/web/playwright/tests/auth-slot-coverage.spec.ts` validates 3 auth states across `/`, `/members`, `/register`, `/privacy`, `/terms`, `/profile`, `/admin`.

## 3. Static Gates

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
rg "#[0-9a-fA-F]{6}" apps/web/src/components/public/PublicHeader.tsx apps/web/src/components/layout/MemberHeader.tsx apps/web/src/components/layout/AdminSidebar.tsx
```

Expected: typecheck/lint pass, HEX grep 0 hits in edited header/sidebar files.
