# Failure Cases

| ID | Failure | Blocker? | Return path |
| --- | --- | --- | --- |
| F-1 | Staging deploy fails | Yes | deployment workflow / UT-27 / UT-28 |
| F-2 | Missing staging secret | Yes | secrets management |
| F-3 | schema sync 401/403/5xx | Yes | 03a / 05a / U-04 |
| F-4 | response sync 401/403/5xx | Yes | 03b / 05a / U-04 |
| F-5 | public route broken | Yes | 06a |
| F-6 | auth/profile route broken | Yes | 05a / 06b |
| F-7 | admin gate leaks | Yes | 05a / 06c |
| F-8 | placeholder evidence found | Yes | 08b / 09a execution |
| F-9 | free-tier estimate exceeded | Yes | sync frequency / deployment design |
