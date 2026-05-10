# UT-17 Alert Policy Matrix

| Metric | Thresholds | Status | Baseline action |
| --- | --- | --- | --- |
| Workers Daily Requests | 80% / 95% | official type pending | email alert if available; otherwise external monitoring follow-up |
| D1 Read Rows | 80% / 95% | D1 billing notification candidate | email alert, webhook only after plan gate |
| D1 Write Rows | 80% / 95% | D1 billing notification candidate | email alert, webhook only after plan gate |
| Pages Build | 80% / 95% | official type pending | do not implement until verified |
| R2 Class A operations | 80% / 95% | usage-based billing candidate | do not implement until verified |

Webhook destinations are not a Free-plan assumption. Relay implementation starts only after the account-level webhook gate is confirmed.
