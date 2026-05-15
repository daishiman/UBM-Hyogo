# Test Strategy

## Component Tests

| File | Coverage |
| --- | --- |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | Home link role/name, `href="/"`, token classes, and sidebar-top placement |
| `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | Fetch path encoding, drawer tag link visibility, percent-encoded `memberId`, and token classes |

## Runtime / Visual Evidence

The existing Playwright admin-pages run currently fails before target screenshots because local admin mock API `/admin/tags/queue` returns 404. Phase 11 therefore uses mock fallback evidence:

- `outputs/phase-11/dom-snapshot.txt`
- `outputs/phase-11/admin-sidebar-logo-link.png`
- `outputs/phase-11/member-drawer-tags-link.png`
- `outputs/phase-11/evidence/playwright-admin-pages.log`

Real authenticated screenshots remain `runtime_pending` until staging admin auth fixture and local mock backend are available.

## Commands

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- AdminSidebar MemberDrawer
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
```
