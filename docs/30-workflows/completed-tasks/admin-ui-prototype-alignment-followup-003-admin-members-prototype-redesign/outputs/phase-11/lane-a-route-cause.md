# Lane A Route-Cause Analysis

## Result

No API route or D1 schema change was required in this local cycle.

## Evidence

- The local Next server rendered `/admin/members` with `INTERNAL_API_BASE_URL=http://127.0.0.1:8787`.
- The mock API returned `GET /admin/members` as 200.
- The same-origin client proxy path for drawer and mutation calls remained unchanged.

## Boundary

The original staging 404 can only be confirmed after staging deploy with authenticated cookies. That runtime verification remains user-gated.
