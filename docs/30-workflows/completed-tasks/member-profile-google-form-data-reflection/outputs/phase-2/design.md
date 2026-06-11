# Phase 2 Design Evidence

Status: completed.

Chosen design:

- `rawFormToStableKeyMap(raw)` is the single raw fallback helper.
- `buildQuestionIdToStableKey(raw, schemaRows)` returns `{ ...fromRaw, ...fromSchema }`, so schema-owned mappings win when present.
- `GoogleFormsClient.getQuestionIdToStableKey(formId)` exposes the resolved qid map size to the sync job.
- `runResponseSync` emits `qid_map_empty` when the resolved map has 0 entries and `all_responses_unmapped` when all processed responses have raw answers but no known stable keys.

Alert schema:

- `blobs`: `["response_sync_mapping_alert", kind]`
- `doubles`: `[qidMapSize, fullyUnmappedResponses, processedCount]`
- `indexes`: `[jobId]`

The sync job remains non-breaking: alerts do not change `status`, cursor progression, lock release, or write behavior.

