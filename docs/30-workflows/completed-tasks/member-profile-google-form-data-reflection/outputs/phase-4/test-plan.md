# Phase 4 Test Plan Evidence

Status: completed.

Focused tests:

| Lane | File | Purpose |
| --- | --- | --- |
| A | `packages/integrations/google/src/forms/mapper.spec.ts` | exported `deriveStableKey`, `STABLE_KEY_BY_LABEL`, `rawFormToStableKeyMap`, and response mapping with fallback map. |
| A | `packages/integrations/google/src/forms/client.branches.spec.ts` | default qid map and `getQuestionIdToStableKey`. |
| A | `apps/api/src/forms/build-qid-map.spec.ts` | raw fallback and schema-wins merge. |
| B | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | `qid_map_empty`, `all_responses_unmapped`, non-breaking verdicts, and partial-unmapped no false positive. |

Contract config note: `apps/api/src/jobs/**/*.contract.spec.ts` is excluded from `vitest.config.ts`; run it with `vitest.d1.config.ts`.

