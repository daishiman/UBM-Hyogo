# Phase 11 Manual Evidence

Screenshots: N/A. This is an API contract follow-up with no UI rendering diff.

| Case | Request | Observed / asserted evidence |
| --- | --- | --- |
| confirmed | `{ "action":"confirmed", "tagCodes":["tag-1"] }` | 200, `ok:true`, `status:"resolved"`, `idempotent:false` |
| rejected | `{ "action":"rejected", "reason":"duplicate" }` | 200, `ok:true`, `status:"rejected"`, `idempotent:false` |
| idempotent confirmed | same confirmed body twice | 200, `idempotent:true`, audit count unchanged |
| idempotent rejected | same rejected body twice | 200, `idempotent:true`, audit count unchanged |
| validation | empty reason or mixed body | 400, `error:"validation_error"` |
| conflict | confirmed then rejected | 409, `error:"state_conflict"` |
| unknown tag | unknown tag code | 422, `error:"unknown_tag_code"` |

Audit sample asserted by tests:

- `admin.tag.queue_resolved` is inserted for confirmed success.
- `admin.tag.queue_rejected` is inserted for rejected success.
- Replay cases do not add audit rows.
