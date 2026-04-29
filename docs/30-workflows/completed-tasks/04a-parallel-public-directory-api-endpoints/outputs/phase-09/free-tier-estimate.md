# Phase 9 — Free-tier 利用量見積もり

## 前提

- Cloudflare Workers Free: 100k req/day、CPU 10ms/req、Subrequest 50/req。
- D1 Free: 5GB ストレージ、5M reads/day、100k writes/day。
- KV Free: 100k reads/day、1k writes/day（本タスクでは未使用）。
- 想定 traffic（MVP 直後）: `/public/stats` 50 req/day、`/public/members` 200 req/day、`/public/members/:id` 300 req/day、`/public/form-preview` 30 req/day。合計 ~580 req/day。

## エンドポイント別 D1 read 見積

| endpoint | クエリ数/req | 行数想定/req | req/day | reads/day |
| --- | --- | --- | --- | --- |
| `/public/stats` | 6 (count×2 + groupBy×2 + meetings + sync_jobs×2) | ~70 行 | 50 | ~300 |
| `/public/members` | 3 (count + list + tags batch) | ~30 行 | 200 | ~600 |
| `/public/members/:id` | 5 (status + response + fields + tags + schema) | ~60 行 | 300 | ~1,500 |
| `/public/form-preview` | 2 (manifest + fields) | ~35 行 | 30 | ~60 |

合計: **~2,460 reads/day** ≪ 5M/day（0.05%）。

## CPU time

- 各 endpoint < 5ms 想定（zod parse + 軽量 SQL）。
- form-preview は 31 fields × 6 sections の組み立てで ~3ms。
- request 上限 10ms に対し余裕あり。

## response size

- `/public/members?limit=24` で member 24 件 × ~600B = ~14KB。
- `/public/members/:id` で section 6 + fields ~30 = ~10KB。
- `/public/stats` ~3KB。
- `/public/form-preview` 31 fields × ~400B = ~12KB。

全て gzip で 5KB 前後。F-21 の 1MB 超は想定 traffic では発生しない。

## 結論

- 現状想定 traffic に対し D1 / Workers free tier に余裕。
- リスクは `/public/members/:id` の急増（profile cache が `no-store` の為）。req/day が 3,000 を超えたら KV cache 検討。
- `Cache-Control: public, max-age=60` (stats / form-preview) で Cloudflare edge cache を活用し、実際の D1 read はさらに低減見込み。
