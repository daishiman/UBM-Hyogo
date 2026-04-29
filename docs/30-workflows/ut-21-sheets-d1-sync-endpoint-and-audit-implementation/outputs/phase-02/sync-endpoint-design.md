# Sync Endpoint Design

## Result

BLOCKED. `POST /admin/sync` を新設する設計は、現行の Forms sync 分割方針と衝突する。

## Current Canonical Endpoints

- `POST /admin/sync/schema`
- `POST /admin/sync/responses`

## Rejected For Now

- `POST /admin/sync`
- `GET /admin/sync/audit`
