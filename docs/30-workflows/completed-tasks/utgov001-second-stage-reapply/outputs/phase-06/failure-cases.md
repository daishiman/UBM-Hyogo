# Phase 6 Output: Failure Cases

| ID | Failure | Detection | Response |
| --- | --- | --- | --- |
| F-1 | UT-GOV-004 contexts stale | Upstream timestamp or check-run mismatch | Stop and refresh upstream task |
| F-2 | Typo context | Applied contexts never turn green | Roll back affected branch |
| F-3 | Dev PUT succeeds, main PUT fails | Main API response non-2xx | Keep dev evidence, roll back if drift policy requires |
| F-4 | Admin block after PUT | Open PR cannot merge despite admin | Roll back immediately |
| F-5 | Secret leakage risk | grep finds token-like value | Stop, remove evidence, rotate if leaked |

All responses preserve user approval and rollback-first governance.
