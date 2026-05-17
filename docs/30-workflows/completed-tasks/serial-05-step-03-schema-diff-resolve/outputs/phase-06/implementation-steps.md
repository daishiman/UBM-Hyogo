**[実装区分: 実装仕様書]**

# Phase 6: 実装手順 — serial-05-step-03-schema-diff-resolve

## Step 0: current topology verification

```bash
sed -n '1,220p' apps/web/app/\(admin\)/admin/schema/page.tsx
sed -n '1,260p' apps/web/src/components/admin/SchemaDiffPanel.tsx
sed -n '1,180p' apps/web/src/lib/admin/api.ts
rg -n 'schema/diff|schema/aliases' apps/api/src/routes/admin/schema.ts
```

Expected facts:

- `page.tsx` calls `fetchAdmin(..., "/admin/schema/diff")`.
- `SchemaDiffPanel` receives `{ total, items }`.
- unresolved status is `queued`.
- `postSchemaAlias()` calls browser proxy `/api/admin/schema/aliases`.

## Step 1: harden SchemaDiffPanel

Keep the existing component. Do not create parallel `SchemaDiffList` / `SchemaDiffResolveForm` unless a later refactor removes `SchemaDiffPanel` in the same wave.

Required behavior:

- 200 apply: success feedback + `router.refresh()`.
- 202 retryable continuation: retryable feedback, no false failure.
- 409 conflict: conflict feedback.
- 422 stable key collision: validation feedback.
- `questionId=null`: assignment disabled with alert.

## Step 2: keep mutation helper single

Preferred path for this existing panel is `postSchemaAlias()` in `apps/web/src/lib/admin/api.ts`.

If the implementation chooses step-01 `useAdminMutation`, use its actual shape:

```typescript
const { trigger, isLoading, error } = useAdminMutation(endpoint, "POST");
```

Do not use `mutate` / `isPending`; those names do not exist in the current hook.

## Step 3: tests

```bash
mise exec -- pnpm test apps/web --run -- SchemaDiffPanel.component.spec.tsx
mise exec -- pnpm test apps/web --run -- api.spec.ts
```

## Step 4: static gates

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
grep -rnE 'bg-\[#|text-\[#|process\.env\.' apps/web/app/\(admin\)/admin/schema apps/web/src/components/admin/SchemaDiffPanel.tsx apps/web/src/lib/admin/api.ts
```

## Step 5: visual smoke

```bash
PLAYWRIGHT_TASK17_ADMIN_FIXTURE=1 mise exec -- pnpm e2e:smoke -- admin-schema-diff-resolve
```

## DoD

- [ ] Current topology evidence captured
- [ ] API / status vocabulary stays `{ total, items }` and `queued|resolved`
- [ ] No new env gate
- [ ] Focused tests green
- [ ] Visual evidence captured in Phase 11
