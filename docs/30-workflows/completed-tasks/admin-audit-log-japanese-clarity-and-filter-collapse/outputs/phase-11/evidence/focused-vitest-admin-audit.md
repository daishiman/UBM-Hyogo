# Focused Vitest Evidence: Admin Audit UI

- Date: 2026-06-11T19:07:39+09:00
- Scope: `apps/web/src/components/admin/`
- Command: `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/admin/__tests__/auditGlossary.spec.ts apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx`
- Result: PASS
- Test files: 4
- Tests: 57

Covered evidence:

- Japanese audit glossary helpers return expected labels and raw-code fallback.
- Applied filter chips use Japanese labels for action, target type, and field names.
- Audit log panel exposes common filters first and advanced target / batch filters through collapsible disclosure.
- Audit log cards render localized action / target labels and stable metadata labels.
