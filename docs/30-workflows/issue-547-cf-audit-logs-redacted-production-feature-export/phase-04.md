# Phase 4: I/O and CLI Contract

## CLI Contract

```bash
CF_AUDIT_REDACT_SECRET=... bash scripts/cf.sh audit-log feature-export \
  --from 2026-02-07T00:00:00Z \
  --to 2026-05-08T00:00:00Z \
  --out outputs/phase-11/production-exported-features.jsonl \
  --manifest-out outputs/phase-11/production-export-manifest.json \
  --confirm-production-export
```

Alternative:

```bash
CF_AUDIT_REDACT_SECRET=local-redaction-secret bash scripts/cf.sh audit-log feature-export \
  --fixture tests/fixtures/cf-audit/feature-export-raw.json \
  --days 90 \
  --out /tmp/cf-audit-features.jsonl \
  --manifest-out /tmp/cf-audit-features.manifest.json \
  --dry-run
```

## Inputs

- `--from` ISO UTC inclusive.
- `--to` ISO UTC exclusive.
- `--days` positive integer, used when explicit window is absent.
- `--out` JSONL path.
- `--manifest-out` JSON path.
- `--fixture` test-only raw event fixture path.
- `--confirm-production-export` required for production D1 backend construction after explicit user approval.
- `CF_AUDIT_REDACT_SECRET` minimum 8 chars.

## Outputs

Each JSONL line:

```ts
type FeatureExportLine = {
  id: string;
  occurredAt: string;
  features: RedactedFeatures;
  label?: "HIGH" | "MEDIUM" | "LOW" | "NONE";
};
```

## Completion

- Invalid combinations fail before D1 access.
- Output paths are not written on validation failure except explicit `.tmp` files cleaned by implementation.
