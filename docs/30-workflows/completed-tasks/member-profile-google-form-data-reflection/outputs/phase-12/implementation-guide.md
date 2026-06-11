# Implementation Guide

## Part 1: Plain Explanation

The profile was empty because the response importer could not translate Google Form question IDs into stable profile fields when `schema_questions` was empty. The fix teaches the importer to derive stable keys directly from the live Google Form labels as a fallback, and it emits an alert when every processed response is still unmapped.

## Part 2: Technical Notes

Implemented changes:

| Area | Files | Result |
| --- | --- | --- |
| Lane A | `packages/integrations/google/src/forms/{mapper,client}.ts` | `deriveStableKey`, `STABLE_KEY_BY_LABEL`, and `rawFormToStableKeyMap` are exported and used by the default qid map. |
| Lane A | `apps/api/src/forms/build-qid-map.ts`, `apps/api/src/index.ts` | API response sync merges raw-form fallback with `schema_questions`; schema rows win when present. |
| Lane B | `packages/integrations/google/src/forms/client.ts`, `apps/api/src/jobs/sync-forms-responses.ts` | `GoogleFormsClient.getQuestionIdToStableKey(formId)` exposes resolved qid map size; empty maps emit `qid_map_empty`, fully unmapped batches emit `all_responses_unmapped`. |
| Lane C | `docs/30-workflows/completed-tasks/member-profile-google-form-data-reflection/runbooks/recovery.md` | Read-only diagnostics and user-gated recovery sequence are fixed. |

Validation:

| Command | Result |
| --- | --- |
| `pnpm exec vitest run packages/integrations/google/src/forms/mapper.spec.ts packages/integrations/google/src/forms/client.branches.spec.ts --config vitest.config.ts` | PASS: 2 files / 18 tests |
| `pnpm exec vitest run apps/api/src/forms/build-qid-map.spec.ts --config vitest.config.ts` | PASS: 1 file / 2 tests |
| `pnpm exec vitest run apps/api/src/jobs/sync-forms-responses.contract.spec.ts --config vitest.d1.config.ts` | PASS: 1 file / 34 tests |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/integrations-google typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/integrations typecheck` | PASS |

Phase 11 screenshots remain user-gated:

| State | Path | Status |
| --- | --- | --- |
| before | `../phase-11/screenshots/member-detail-before-recovery.png` | pending user gate |
| after | `../phase-11/screenshots/member-detail-after-recovery.png` | pending user gate |
