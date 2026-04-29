# Phase 11 — Manual Test Checklist

UI なしの API-only タスクのため、画面スクリーンショットは不要。

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| `GET /me` 401 / 200 / 410 | PASS | `apps/api/src/routes/me/index.test.ts` |
| `GET /me/profile` response schema | PASS | `MeProfileResponseZ.parse` + route test |
| `POST /me/visibility-request` queue 投入 | PASS | route test + `adminNotes` repository test |
| `POST /me/delete-request` queue 投入 | PASS | route test |
| rate limit 5 req/min | PASS | route test |
| `admin_member_notes` 非露出 | PASS | zod strict + JSON leak test |
