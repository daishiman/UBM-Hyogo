# Phase 11 Link Checklist

| Link / target | Status | Notes |
| --- | --- | --- |
| `apps/web/playwright/tests/admin-pages.spec.ts` | PASS | Uses `AdminSchemaPage.assertSectionCount(4)` and `screenshot("admin-schema", "desktop")` |
| `apps/web/playwright/page-objects/AdminSchemaPage.ts` | PASS | Four-section POM contract |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | PASS | Four panes, recommended stableKeys, dryRun-before-apply, protected key UI guard |
| `apps/api/src/routes/admin/schema.ts` | PASS | `recommendedStableKeys`, dryRun, protected stableKey 422 |
| `apps/api/src/workflows/schemaAliasAssign.ts` | PASS | `publicConsent`, `rulesConsent`, `responseEmail` rejected in workflow |
| 08b screenshot target | PENDING_RUNTIME | Requires admin auth and D1 fixture |
