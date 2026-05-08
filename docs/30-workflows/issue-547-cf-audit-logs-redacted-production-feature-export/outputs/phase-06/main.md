# Phase 6 Output: Function Signatures and Pseudocode

Verdict: `COMPLETED`

Implemented signatures:

```ts
readEventsForFeatureExport(db, window)
validateRedactedFeatureLine(line, index)
validateRedactedFeatureJsonl(jsonl)
buildFeatureExportManifest(input)
exportRedactedFeatureDataset(input)
```

The implementation follows the Phase 6 pseudocode with one stricter detail: JSONL and manifest are written to `.tmp` paths first, then renamed to final paths only after schema validation, redaction guard, and leakage scan pass.
