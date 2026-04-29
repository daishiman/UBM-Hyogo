# Phase 9 — Free-tier 見積もり

## D1 (5GB / 500k reads/day / 100k writes/day)

| 操作 | 1 リクエストあたり read/write | 想定 QPS (DAU 200, 平均 5 req/day) | 1 日 read | 1 日 write |
| --- | --- | --- | --- | --- |
| GET /me | 3 reads (identity + status + admin) | 1000 | 3,000 | 0 |
| GET /me/profile | 7 reads (builder) | 500 | 3,500 | 0 |
| POST /me/visibility-request | 3 reads + 2 writes (notes + audit) | 5 | 15 | 10 |
| POST /me/delete-request | 同上 | 1 | 3 | 2 |
| 合計 | - | - | ~6,500 reads/day | ~12 writes/day |

無料枠 (500k reads / 100k writes /day) に対して 1.3% / 0.012% 程度。十分余裕。

## Workers (100k req/day)

GET /me/* + POST 系合計 ~1,500 req/day で 1.5%。

## Secret 数

新規導入: 0。既存の `GOOGLE_FORM_RESPONDER_URL` を任意で参照するのみ。
