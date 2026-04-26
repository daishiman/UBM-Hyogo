# Failure Cases

| ID | Failure Case | Mitigation |
| --- | --- | --- |
| FC-01 | D1 does not support persistent `journal_mode=WAL` | Do not mutate journal mode; use retry/backoff and queue serialization. |
| FC-02 | PRAGMA applies only to current transaction | Treat output as diagnostic only; do not use it as persistent configuration evidence. |
| FC-03 | Local D1 behavior differs from remote D1 | Verify in staging before relying on behavior. |
| FC-04 | Production rollback command is proposed without support evidence | Do not run rollback PRAGMA; document non-mutation and use runtime mitigations. |
| FC-05 | `database_id` placeholder reaches execution | Block runtime task until real binding values are confirmed by 02-serial owner. |
