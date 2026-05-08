# Phase 11 Evidence

Status: `IMPLEMENTATION_PASS_SYNTHETIC` (synthetic 90-day fixture replay).

Boundary rule (unchanged): synthetic fixture output proves comparison harness shape only. Production winner selection requires FU-03-B redacted 90-day dataset replay (FU-03-D).

## Evidence

| Evidence | Path | Status |
| --- | --- | --- |
| typecheck.log | `evidence/typecheck.log` | exit 0 |
| lint.log | `evidence/lint.log` | exit 0 |
| vitest.log | `evidence/vitest.log` | exit 0 (5 focused files, 15 tests pass) |
| comparison-metrics.json | `comparison-metrics.json` | generated |
| model-comparison-report.md | `model-comparison-report.md` | generated |
| leakage-grep.log | `evidence/leakage-grep.log` | exit 0 (4/4 outputs clean) |

## Synthetic comparison summary

| classifier | precision | recall | fp | fn | fallbackRate | latencyP95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| threshold | 0.31 | 1.0 | 288 | 0 | 0 | 0.005 |
| isolation-forest | 0.18 | 1.0 | 589 | 0 | 0 | 0.08 |
| xgboost | 1.0 | 1.0 | 0 | 0 | 0 | 0.03 |
| workers-ai | 0.31 | 1.0 | 288 | 0 | 1.0 | 0.003 |

Synthetic-only winner: `xgboost` (informational, not authoritative).

> The synthetic dataset is biased toward foreign-IP anomalies on a small distribution. The xgboost win signal is meaningful as a harness sanity check but **must not** be promoted to production. Production selection requires the FU-03-B 90-day redacted dataset.

## Run commands

```bash
ESBUILD_BINARY_PATH=./node_modules/esbuild/node_modules/@esbuild/darwin-arm64/bin/esbuild \
  pnpm tsx scripts/cf-audit-log/evaluation/training/train-isolation-forest.ts \
  --input tests/fixtures/cf-audit/labeled-90day.jsonl \
  --output tests/fixtures/cf-audit/model-isolation-forest.json \
  --num-trees 30 --sub-sample 64 --seed 42

ESBUILD_BINARY_PATH=./node_modules/esbuild/node_modules/@esbuild/darwin-arm64/bin/esbuild \
  pnpm tsx scripts/cf-audit-log/evaluation/training/train-xgboost.ts \
  --input tests/fixtures/cf-audit/labeled-90day.jsonl \
  --output tests/fixtures/cf-audit/model-xgboost.json \
  --num-rounds 15 --max-depth 4 --seed 42

ESBUILD_BINARY_PATH=./node_modules/esbuild/node_modules/@esbuild/darwin-arm64/bin/esbuild \
  pnpm tsx scripts/cf-audit-log/evaluation/model-comparison.ts \
  --compare-models tests/fixtures/cf-audit/labeled-90day.jsonl \
  --if-model tests/fixtures/cf-audit/model-isolation-forest.json \
  --xgb-model tests/fixtures/cf-audit/model-xgboost.json \
  --output-json docs/30-workflows/issue-548-ml-model-selection/outputs/phase-11/comparison-metrics.json \
  --output-md   docs/30-workflows/issue-548-ml-model-selection/outputs/phase-11/model-comparison-report.md
```
