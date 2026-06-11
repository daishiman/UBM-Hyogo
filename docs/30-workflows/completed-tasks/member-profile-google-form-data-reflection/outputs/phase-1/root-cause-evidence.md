# Root Cause Evidence

Status: completed.

Staging D1 investigation on 2026-06-10 identified the causal chain:

1. Target member response exists with `answers_json='{}'`.
2. `response_fields` has 16 rows, all under `__extra__:<questionId>`, with known stableKey rows at 0.
3. `schema_questions` has 0 rows.
4. Raw answers are present, so data arrived but was not mapped.

Implementation trace:

- `apps/api/src/index.ts` previously built `questionIdToStableKey` only from `listFieldsByVersion(...)`.
- `packages/integrations/google/src/forms/mapper.ts` places unknown question IDs into `unmappedQuestionIds`.
- Public profile view skips fields without public schema metadata, causing the observed empty display.

