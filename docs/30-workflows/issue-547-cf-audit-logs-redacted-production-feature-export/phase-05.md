# Phase 5: Data Model and Manifest

## D1 Read Model

Source table: `cf_audit_log` from `apps/api/migrations/0014_create_cf_audit_log.sql`.

Required selected columns:

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

Forbidden output columns:

- `raw_json`
- full `actor_email`
- full `actor_ip`
- full `actor_ua`
- token id / token value

## Manifest

```ts
type FeatureExportManifest = {
  exportRunId: string;
  source: "cf_audit_log";
  windowFromUtc: string;
  windowToUtc: string;
  rowCount: number;
  sha256: string;
  redactionPolicyVersion: "feature-v1";
  schemaVersion: "redacted-features-v1";
  generatedAt: string;
};
```

## Completion

- SHA-256 is computed over final JSONL bytes.
- Manifest is written only after validation and leakage gates pass.
