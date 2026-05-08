# Phase 6: Function Signatures and Pseudocode

## Required Signatures

```ts
export async function readEventsForFeatureExport(
  db: D1Like,
  window: FeatureExportWindow,
): Promise<AuditLogEvent[]>;

export function validateRedactedFeatureLine(
  line: unknown,
  index: number,
): void;

export function validateRedactedFeatureJsonl(jsonl: string): void;

export function buildFeatureExportManifest(input: {
  exportRunId: string;
  window: FeatureExportWindow;
  rowCount: number;
  jsonl: string;
  now: Date;
}): FeatureExportManifest;

export async function exportRedactedFeatureDataset(input: {
  db: D1Like;
  window: FeatureExportWindow;
  redactSecret: string;
  outPath: string;
  manifestPath: string;
  now?: () => Date;
}): Promise<FeatureExportManifest>;
```

## Pseudocode

```ts
assertValidWindow(window);
assertRedactSecret(redactSecret);
const events = await readEventsForFeatureExport(db, window);
const lines = events.map(toFeatureExportLine);
const jsonl = renderJsonl(lines);
validateRedactedFeatureJsonl(jsonl);
guardJsonlOrThrow(jsonl);
writeFileSync(outPath, jsonl);
const scan = scanForSecrets(outPath);
if (scan.hits.length > 0) throw new Error("secret leakage detected");
const manifest = buildFeatureExportManifest(...);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
return manifest;
```

## Completion

- Function signatures are sufficient for implementation without further design decisions.
