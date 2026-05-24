# Admin Shared Components

`_shared/` contains reusable admin UI pieces introduced by
`admin-ui-prototype-alignment`. They are presentation primitives for admin pages;
they must not call admin APIs, mutate server state, or import D1 bindings.

## Components

| Component | Responsibility | Notes |
| --- | --- | --- |
| `AdminSectionCard` | Framed admin section with heading, description, actions, and stable `aria-labelledby` | Use for page sections that can degrade independently. |
| `AdminSectionError` | Recoverable per-section fetch failure UI | Render instead of throwing to the page-level error boundary. |
| `AdminEmptyState` | Business-context empty state | Copy should explain the next useful action, not only "no data". |
| `AdminStat` | KPI/stat display | Use tokenized admin CSS classes; do not hard-code colors. |
| `AdminTable` | Sortable client table wrapper | Keep row data rendering in callers via `columns`. |
| `AdminQueuePanel` | Shared queue layout shell | Keep domain-specific resolve logic in route components or existing panels. |

## Fetch Failure Pattern

Server components should use `safeServerFetch<T>()` from
`apps/web/src/lib/admin/safe-server-fetch.ts` when a fetch failure is recoverable
inside one section.

```tsx
const result = await safeServerFetch<View>("/admin/example");

return result.ok ? (
  <ExampleSection view={result.data} />
) : (
  <AdminSectionError
    sectionLabel="Example"
    code={result.error.code}
    message={result.error.message}
  />
);
```

Page-level `error.tsx` remains reserved for unexpected render failures that
cannot be represented as a section result.
