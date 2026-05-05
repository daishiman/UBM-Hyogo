# Phase 8 Output: DRY 化

## 判定

The minimal DRY point is the shared admin search schema and URL helper.

## Unified Terms

- Endpoint path variable: `:memberId`
- Audit table: `audit_log`
- Search limits: `ADMIN_SEARCH_LIMITS`
- Page size: fixed `50`
- UI canonical: `/admin/members` list + right drawer
