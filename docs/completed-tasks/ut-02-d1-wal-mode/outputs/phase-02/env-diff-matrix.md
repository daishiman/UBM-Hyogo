# Environment Difference Matrix

| Environment | WAL Assumption | Verification | Policy |
| --- | --- | --- | --- |
| local | Not authoritative | `wrangler d1 execute --local ... "PRAGMA journal_mode;"` may differ from remote behavior | Use only as local signal. |
| staging | Authoritative for project behavior | Run support-check commands only after 02-serial approval | Record evidence before any production action. |
| production | No mutation from UT-02 | Production changes require explicit runtime task execution | Do not run unconditional rollback or journal changes. |
