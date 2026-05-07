# Phase 6 Output: 異常系検証

## 判定

The abnormal contract is fixed for implementation verification.

## Status Codes

- 401: unauthenticated
- 403: non-admin
- 404: unknown member
- 409: delete/restore state conflict
- 422: invalid query or mutation body

## Edge Cases

Unknown tag code is not a validation error. It returns 200 with zero matching rows when no member satisfies the tag AND condition.
