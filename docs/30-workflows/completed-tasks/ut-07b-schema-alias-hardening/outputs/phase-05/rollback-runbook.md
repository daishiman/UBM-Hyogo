# Rollback Runbook

Status: spec_created

Rollback scenarios:

| Scenario | Action |
| --- | --- |
| index blocks rollout | drop the new index and record audit evidence |
| pre-existing collision found | quarantine one row to `unknown` or merge manually before retry |
| back-fill cursor migration fails | stop before route rollout and keep API contract unchanged |
| CPU exhaustion persists | keep alias confirmation, mark back-fill resumable, formalize queue/cron follow-up |

Rollback evidence must avoid secrets and production PII.
