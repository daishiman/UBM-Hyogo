# Phase 7: Consistency Gates

## Gates

| Gate | Check |
| --- | --- |
| Parent alignment | Parent #515 remains ML-ready abstraction; #547 only creates dataset export. |
| Issue #546 | Runtime 90 day evidence is an upstream operational gate for production dataset completeness. |
| Issue #514 | Cold storage R2 export remains separate. |
| Schema | `RedactedFeatures` fields match `features/schema.ts`. |
| Security | No raw D1 field crosses output boundary. |

## Commands

```bash
rg -n "FeatureExport|readEventsForFeatureExport|feature-export" scripts/cf-audit-log
rg -n "raw_json|actor_email|actor_ua" scripts/cf-audit-log/feature-export.ts scripts/cf-audit-log/feature-export || true
```

## Completion

- Implementation can demonstrate all gates in Phase 11 evidence.
