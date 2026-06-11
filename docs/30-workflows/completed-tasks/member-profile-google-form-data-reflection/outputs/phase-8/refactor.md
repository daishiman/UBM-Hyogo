# Phase 8 Refactor Evidence

Status: completed.

Refactor decisions:

- Stable-key derivation is centralized in `packages/integrations/google/src/forms/mapper.ts`.
- Client default qid map and API fallback share `rawFormToStableKeyMap`.
- API-specific schema merge is isolated in `apps/api/src/forms/build-qid-map.ts`.
- `GoogleFormsClient.getQuestionIdToStableKey` avoids relying on response-level inference for qidMap size.

The refactor keeps production behavior compatible when `schema_questions` is populated and adds raw fallback only where schema rows are absent.

