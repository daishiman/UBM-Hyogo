# Unassigned Task Detection

Status: 3 follow-up tasks formalized under `docs/30-workflows/unassigned-task/`; all gated on runtime evidence.

| Pattern | Result | Disposition |
| --- | --- | --- |
| Type to implementation | Pending Phase 11 gate | No new task |
| Contract to test | Covered by this workflow if gate GO | No new task |
| UI spec to component | Admin progress UI remains UT-07B-FU-02 scope | Existing follow-up |
| Spec drift to decision | Gate vocabulary and contract matrix fixed in this cycle | Absorbed |

Formalized follow-up tasks (placed under `docs/30-workflows/unassigned-task/`):

| Candidate | Task spec | Disposition |
| --- | --- | --- |
| Queue dead-letter monitoring dashboard | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` | formalized as standalone follow-up; gated on runtime evidence (user-approved Cloudflare Queue/DLQ creation + deploy 後に着手) |
| Cursor semantics migration | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` | formalized as standalone follow-up; gated on remaining-scan 劣化観測 (現状は remaining-scan が base case) |
| 50,000+ row extended fixture | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-extended-fixture-50k.md` | formalized as standalone follow-up; gated on Phase 11 staging evidence で 10,000+ rows persistent CPU budget exhaustion を確認した後 |
