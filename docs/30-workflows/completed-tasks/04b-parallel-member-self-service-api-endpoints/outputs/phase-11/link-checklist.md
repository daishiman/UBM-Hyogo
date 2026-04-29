# Phase 11 — Link Checklist

## Evidence Links

| 項目 | 状態 | 参照 |
| --- | --- | --- |
| Phase 11 main | PASS | `outputs/phase-11/main.md` |
| manual evidence | PASS | `outputs/phase-11/manual-evidence.md` |
| manual smoke log | PASS | `outputs/phase-11/manual-smoke-log.md` |
| API route tests | PASS | `apps/api/src/routes/me/index.test.ts` |
| UI screenshot | N/A | UI 変更なし。API-only のため curl / test evidence で代替 |

## Endpoint Checklist

| endpoint | evidence |
| --- | --- |
| `GET /me` | `index.test.ts` GET /me block |
| `GET /me/profile` | `index.test.ts` GET /me/profile block |
| `POST /me/visibility-request` | `index.test.ts` visibility-request block |
| `POST /me/delete-request` | `index.test.ts` delete-request block |
