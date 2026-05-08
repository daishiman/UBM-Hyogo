# Phase 5 Output: Data Model and Manifest

Verdict: `COMPLETED`

`readEventsForFeatureExport()` selects only the columns required for feature extraction and classification context:

- `id`
- `occurred_at`
- `occurred_at_ms`
- `actor_email`
- `actor_ip`
- `actor_ua`
- `action_type`
- `action_result`
- `result_code`
- `resource_type`
- `resource_id`
- `severity`
- `issue_number`

`raw_json` is intentionally not selected by the feature export read path. Manifest SHA-256 is computed from the final JSONL bytes.
