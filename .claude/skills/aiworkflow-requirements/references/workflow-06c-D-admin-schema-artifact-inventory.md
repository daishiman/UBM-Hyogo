# Artifact Inventory — 06c-D-admin-schema

## canonical root

`docs/30-workflows/completed-tasks/06c-D-admin-schema/`

## workflow state

| field | value |
| --- | --- |
| workflow_state | `spec_created` |
| taskType | `implementation-spec` |
| docs scope | `true` |
| remaining scope | `true` |
| visual evidence | `VISUAL_ON_EXECUTION`（implementation execution / 08b admin Playwright E2E / 09a staging smoke 委譲） |

## root artifacts

| artifact | status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `phase-01.md` ... `phase-13.md` | present |

## phase 12 required artifacts

| artifact | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present（08b screenshot evidence path を参照） |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present（0 new unassigned tasks） |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## phase 11 evidence

| artifact | status |
| --- | --- |
| `outputs/phase-11/main.md` | present（`VISUAL_ON_EXECUTION_PENDING` handoff） |
| `outputs/phase-11/screenshots/admin-schema.png` | absent（authenticated admin session + D1 schema-diff fixture が必要なため 08b / 09a で取得） |
| `08b evidence target` | `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/evidence/desktop/admin-schema.png` |

## implementation source-of-truth

| layer | path |
| --- | --- |
| Web route | `apps/web/app/(admin)/admin/schema/page.tsx` |
| Web component | `apps/web/src/components/admin/SchemaDiffPanel.tsx` |
| Web component tests | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` |
| Web admin API client | `apps/web/src/lib/admin/api.ts` |
| Playwright POM | `apps/web/playwright/page-objects/AdminSchemaPage.ts` |
| Playwright spec | `apps/web/playwright/tests/admin-pages.spec.ts` |
| API route | `apps/api/src/routes/admin/schema.ts` |
| API workflow | `apps/api/src/workflows/schemaAliasAssign.ts` |
| D1 storage | `schema_aliases`, `audit_log` |

## scope notes

- `/admin/schema` is the admin UI gate for the existing 07b schema alias workflow; it does not revive the old 06c parent task.
- Canonical endpoints are `GET /admin/schema/diff`, `POST /admin/schema/aliases`, and `POST /admin/sync/schema`.
- Deprecated names `schema_alias`, `schema_alias_audit`, `/api/admin/schema/aliases`, and `/api/admin/schema/resync` are not canonical.
- The UI has four canonical diff panes: `added`, `changed`, `removed`, `unresolved`.
- `publicConsent`, `rulesConsent`, and `responseEmail` are protected stableKeys and cannot be assigned through alias workflow.
- Runtime screenshot capture is delegated to 08b / 09a because the page requires admin auth and fixture-backed schema diff rows.
