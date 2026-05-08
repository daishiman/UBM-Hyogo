# Phase 3: Design

## Purpose

ML 用 redacted feature export pipeline の設計を確定する。

## Module Design

```text
scripts/cf-audit-log/
  feature-export.ts
  feature-export/
    manifest.ts
    schema-validation.ts
```

## Data Flow

1. CLI parses `--from/--to` or `--days`.
2. `readEventsForFeatureExport(db, window)` reads D1 rows as `AuditLogEvent[]`.
3. `extractFeatures(event, { redactSecret })` converts each event to `RedactedFeatures`.
4. JSONL wrapper adds `id`, `occurredAt`, optional `label`.
5. `validateRedactedFeatureJsonl(jsonl)` validates every line.
6. `guardJsonlOrThrow(jsonl)` and `scanForSecrets(outPath)` both pass.
7. Manifest JSON is written after all gates pass.

## Non Goals

- No R2 upload in this task.
- No model training.
- No production classifier switch.

## Completion

- Design preserves raw-source / feature-dataset boundary.
- Manifest is local artifact, not D1 mutation.
