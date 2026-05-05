# Post-Deletion Smoke

state: PENDING_RUNTIME_EXECUTION
date: -
operator: -
redaction: -
runtime_pass: PENDING
ac_link: AC-1, AC-6

## Required Runtime Evidence

| Target | Command | HTTP status |
| --- | --- | --- |
| production | `curl -sS -o /dev/null -w '%{http_code}\n' https://<production-host>/` | - |
| staging | `curl -sS -o /dev/null -w '%{http_code}\n' https://<staging-host>/` | - |

## PASS Criteria

- Production and staging return expected success status after Pages deletion.
- The smoke is captured within one hour of deletion.
