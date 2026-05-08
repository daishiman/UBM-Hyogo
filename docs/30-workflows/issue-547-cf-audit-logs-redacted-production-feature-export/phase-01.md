# Phase 1: Requirements / Implementation Classification

[実装区分: 実装仕様書]

## Purpose

Issue #547 の目的を、コード実装に落とせる要件として確定する。対象は Cloudflare Audit Logs の raw D1 store `cf_audit_log` から、ML 学習・評価に使える 90 日分の redacted feature JSONL を生成する pipeline である。

## Decision

| Item | Decision |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue state | CLOSED 維持。PR は `Refs #547` のみ |
| Upstream | Issue #546 Gate-A の 90 日 baseline evidence |
| Primary risk | raw IP / full UA / actor email / token-like value / `raw_json` 混入 |

## Requirements

- 90 日 window を `--from/--to` または `--days 90` で指定できる。
- D1 query は read-only。production mutation は禁止。
- 出力は `FeatureExportLine` JSONL と `FeatureExportManifest` JSON。
- export pipeline 内で schema validation と secret leakage scan を実行する。
- validation / leakage hit / redaction secret missing は fail closed。

## Implementation Targets

- New: `scripts/cf-audit-log/feature-export.ts`
- New: `scripts/cf-audit-log/feature-export/schema-validation.ts`
- New: `scripts/cf-audit-log/feature-export/manifest.ts`
- Edit: `scripts/cf-audit-log/d1-client.ts`
- New: `scripts/cf-audit-log/__tests__/feature-export.test.ts`
- New: `tests/fixtures/cf-audit/feature-export-raw.json`

## Completion

- Requirements above are reflected in `index.md` AC-1 through AC-10.
- No task is classified as docs-only.
- Closed Issue policy is explicit.
