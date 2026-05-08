# Phase 10: Runtime and Deployment Plan

## Local / Dry Run

Use fixture mode first:

```bash
CF_AUDIT_REDACT_SECRET=local-redaction-secret bash scripts/cf.sh audit-log feature-export \
  --fixture tests/fixtures/cf-audit/feature-export-raw.json \
  --days 90 \
  --out outputs/phase-11/fixture-exported-features.jsonl \
  --manifest-out outputs/phase-11/fixture-export-manifest.json \
  --dry-run
```

## Production Read-Only Run

Production D1 read is user-gated. Command shape:

```bash
CF_AUDIT_REDACT_SECRET=<from-1password> bash scripts/cf.sh audit-log feature-export \
  --from <UTC-90-days-ago> \
  --to <UTC-now-day-boundary> \
  --out docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/outputs/phase-11/production-exported-features.jsonl \
  --manifest-out docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/outputs/phase-11/production-export-manifest.json \
  --confirm-production-export
```

## Approval Gates

| Gate | Required approval |
| --- | --- |
| G1 | Run local fixture export |
| G2 | Run staging/read-only D1 export if available |
| G3 | Run production read-only export |
| G4 | Publish PR with `Refs #547` |

## Completion

- No automatic production run is added.
- Runtime commands are documented with secret values omitted.
