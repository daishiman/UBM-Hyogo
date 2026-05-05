# Dormant Period Log

state: PENDING_RUNTIME_EXECUTION
date: -
operator: -
redaction: -
runtime_pass: PENDING
ac_link: AC-3

## Observation Window

| Field | Value |
| --- | --- |
| started_on | - |
| ended_on | - |
| minimum_duration | 14 days |
| rollback_triggered | - |

## Samples

| Date | Workers 4xx/5xx summary | latency p50/p95 | Pages traffic | Note |
| --- | --- | --- | --- | --- |
| - | - | - | - | - |

## PASS Criteria

- `ended_on` is at least 14 days after `started_on`.
- No rollback trigger occurred during the observation window.
- Pages stayed dormant and Workers remained healthy.
