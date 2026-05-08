# Model Comparison Report

- dataset: `tests/fixtures/cf-audit/labeled-90day.jsonl`
- size: 720
- generated: 2026-05-08T07:34:38.425Z

## Metrics

| classifier | version | precision | recall | fp | fn | fpRate | fnRate | fallbackRate | latencyP50 | latencyP95 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| threshold | threshold@1.0.0 | 0.312649 | 1 | 288 | 0 | 0.488964 | 0 | 0 | 0.0023 | 0.006 |
| isolation-forest | isolation-forest@1.0.0 | 0.181944 | 1 | 589 | 0 | 1 | 0 | 0 | 0.015 | 0.0428 |
| xgboost | xgboost@1.0.0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0.0097 | 0.0368 |
| workers-ai | workers-ai@1.0.0 | 0.312649 | 1 | 288 | 0 | 0.488964 | 0 | 1 | 0.0017 | 0.0025 |

## Selection

- winner: **xgboost**
- criteria: {"precisionMinDelta":0.05,"recallMinAbsolute":"baseline","fallbackRateMax":0.01,"latencyP95Max":500}
- tieBreaker: precision_desc → latencyP95_asc → fallbackRate_asc

### Rejected

- isolation-forest: precision_below_baseline+5pt
- workers-ai: precision_below_baseline+5pt,fallbackRate>0.01
