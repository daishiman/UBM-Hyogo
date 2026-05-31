# Unassigned task detection

## Current cycle result

New unassigned tasks required for #982 scope: 0.

No detected #982 acceptance criterion is moved to backlog or another PR. Task A/B/C keep the required API, repository, audit, web UI, visual baseline, and invariant documentation in one implementation cycle.

## Scope-out candidates

| Candidate | Classification | Reason |
| --- | --- | --- |
| tag master pagination / search | future consideration, not unassigned from #982 | current drawer MVP can read active master tags as one list |
| bulk tag assign | future product scope, not unassigned from #982 | #982 is single-member drawer editing |
| #981 list enrichment data-source sharing | separate existing issue | #982 defines member-specific `GET /admin/members/:memberId/tags` and is not blocked |

## CONST_005 check

No current-cycle improvement is left as a TODO comment, backlog note, or separate PR. If future implementation discovers one of the above candidates is required for AC fulfillment, it must be completed in that same implementation cycle or escalated before being formalized.

## Scope-out candidate formalization (2026-05-30, user-directed)

The "New unassigned tasks required for #982 scope: 0" conclusion above is unchanged — none of the scope-out candidates is required to fulfill any #982 acceptance criterion. Per explicit user direction during the unassigned-task-creation cycle, the three scope-out candidates were formalized as **future** follow-up specs and registered (with 2x verification, CONST_002). One was found to duplicate an existing Issue and was aggregated instead of newly filed.

| Candidate | Spec | Issue | Notes |
| --- | --- | --- | --- |
| admin API server-side Idempotency-Key store / middleware | `unassigned-task-specs/issue-982-drawer-tag-pill-editing-followup-001-admin-idempotency-key-server-store.md` | **#913 (aggregated, not newly filed)** | duplicate of `issue-842-followup-003-server-idempotency-key-persistence` (CLOSED, status:unassigned). issue-982 spec kept as supplementary context (PK implicit-idempotency dependency). |
| tag master (`tag_definitions`) write endpoints + pagination/search | `unassigned-task-specs/issue-982-drawer-tag-pill-editing-followup-002-tag-master-write-endpoints.md` | #1035 (OPEN) | priority:low, scale:medium |
| bulk member tag assign | `unassigned-task-specs/issue-982-drawer-tag-pill-editing-followup-003-bulk-member-tag-assign.md` | #1036 (OPEN) | priority:low, scale:large |
