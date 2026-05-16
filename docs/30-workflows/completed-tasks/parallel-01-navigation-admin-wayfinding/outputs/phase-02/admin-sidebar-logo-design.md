# Admin Sidebar Logo Link Design

## Decision

Place a home link as the first focusable element inside `nav.admin-sidebar`.

```tsx
<Link
  href="/"
  aria-label="ホームに戻る"
  className="mb-4 inline-flex items-center rounded-sm border border-[var(--ubm-color-border-default)] px-3 py-2 text-sm font-semibold text-[var(--ubm-color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
>
  UBM兵庫
</Link>
```

## Acceptance Mapping

| AC | Design |
| --- | --- |
| AC-1 | `href="/"` home link before nav items |
| AC-4 | Existing CSS variables only; no HEX literals |
| AC-5 | Japanese `aria-label` and tokenized focus-visible outline |

## Test Mapping

`apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` asserts link count, `href`, `aria-label`, token classes, and top-level sidebar placement.
