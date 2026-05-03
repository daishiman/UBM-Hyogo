# Implementation Guide

## Part 1: Middle-school Explanation

Google Form questions and database field names are different labels for related things. `/admin/schema` is the admin-only page that lets operators connect those labels safely. Some fields, such as consent and response email, are protected because changing them would break core behavior.

Daily-life example: think of a classroom seating chart. Google Form has a seat number, while the app has the student's name. `/admin/schema` is where a teacher checks that seat 12 really means "Yamada Taro" before writing it into the official list.

Self-check terms:

| Term | Simple meaning |
| --- | --- |
| schema diff | A difference between the latest Google Form and the app's known fields |
| stableKey | The app's stable field name |
| alias | A safe connection from a Form question ID to a stableKey |
| dryRun | A rehearsal that shows what would change without saving |
| audit_log | The record of who changed what |
| protected field | A field that cannot be reassigned because it supports core behavior |

## Part 2: Technical Guide

Use the existing 07b / UT-07B alias pipeline:

- Read unresolved schema differences from `GET /admin/schema/diff`.
- Apply aliases through `POST /admin/schema/aliases`.
- Trigger schema sync through `POST /admin/sync/schema`.
- Persist manual aliases in `schema_aliases`.
- Record admin operations in `audit_log`.
- Show `recommendedStableKeys` when the diff API returns candidates.
- Run `POST /admin/schema/aliases` with `{ dryRun: true }` first, show the affected count and conflict state, then submit apply with `{ dryRun: false }`.
- Treat `publicConsent`, `rulesConsent`, and `responseEmail` as protected stableKeys. The UI rejects them before submit and the API returns `422 protected_stable_key`.

The implementation should not introduce `schema_alias`, `schema_alias_audit`, `/api/admin/schema/aliases`, or `/api/admin/schema/resync` as new canonical contracts.

TypeScript shape:

```ts
type SchemaDiffItem = {
  diffId: string;
  type: "added" | "changed" | "removed" | "unresolved";
  questionId: string | null;
  stableKey: string | null;
  label: string;
  status: "queued" | "resolved";
  createdAt: string;
  recommendedStableKeys?: string[];
};
```

Error handling:

| Status | UI behavior |
| --- | --- |
| 401 / 403 | stay fail-closed under admin auth gate |
| 409 | show mismatch or actor conflict as a retryable admin operation problem |
| 422 `stable_key_collision` | show collision and do not apply |
| 422 `protected_stable_key` | show protected-field error and do not apply |

## Screenshot Evidence Reference

Runtime visual evidence is intentionally delegated because `/admin/schema` requires an authenticated admin session and D1 schema-diff fixture data. The screenshot target is:

- `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/evidence/desktop/admin-schema.png`

The Playwright owner is `apps/web/playwright/tests/admin-pages.spec.ts`, using `AdminSchemaPage.assertSectionCount(4)` and `BasePage.screenshot("admin-schema", "desktop")`. Until 08b or 09a executes with fixture data, `docs/30-workflows/completed-tasks/06c-D-admin-schema/outputs/phase-11/main.md` remains the handoff record rather than a runtime PASS screenshot.
