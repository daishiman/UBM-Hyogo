# Member Drawer Tag Link Design

## Decision

Add a final action section after the audit-log section. The link reuses the existing `/admin/tags` page contract and does not call `onClose()` manually.

```tsx
<section className="border-t border-[var(--ubm-color-border-default)] pt-4">
  <Link
    href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}
    className="inline-flex items-center text-sm font-medium text-[var(--ubm-color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
  >
    タグ管理へ
  </Link>
</section>
```

## Acceptance Mapping

| AC | Design |
| --- | --- |
| AC-2 | Link appears at the drawer content bottom behind a border separator |
| AC-3 | `memberId` is encoded with `encodeURIComponent` |
| AC-4 | Existing CSS variables only; no HEX literals |
| AC-5 | Link text is explicit and focus-visible outline is present |

## Test Mapping

`apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` mocks the detail fetch and asserts the percent-encoded `href` for `member/@id 01`.
