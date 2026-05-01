# Large-Scale Measurement Plan

Status: spec_created

Phase 11 must run staging D1 / Workers evidence with at least 10,000 `response_fields` rows.

| Fixture | Expected decision |
| --- | --- |
| 10,000 rows | must complete with recorded batch count, CPU time, and retry count |
| 50,000 rows | should complete with bounded retries or produce a follow-up decision |
| 100,000 rows | optional stress evidence; persistent overruns trigger queue/cron follow-up |

Evidence must use `scripts/cf.sh`, mask secrets, and avoid screenshot placeholders.
