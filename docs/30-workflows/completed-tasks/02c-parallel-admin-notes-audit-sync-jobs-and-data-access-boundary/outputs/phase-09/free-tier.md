# Phase 9 — Cloudflare 無料枠評価

## 1. D1（5GB / 500k reads/day / 100k writes/day）

| repository | 想定 reads / day | 想定 writes / day | 備考 |
| --- | --- | --- | --- |
| adminUsers | < 100（admin gate のみ） | <数件 | 無視できる |
| adminNotes | < 1000 | <数件 | 04c admin UI 経由 |
| auditLog | <数百（管理画面で表示） | < 100 | append-only。3 ヶ月で <10MB 想定 |
| syncJobs | < 50（latest 取得） | < 100（cron 実行 / 日） | 0 |
| magicTokens | <数十 | <数十 | TTL 短め、定期 cleanup を Phase 11 で計画 |

→ 全部足しても **D1 無料枠の 1% 未満**。

## 2. Workers（100k req/day on Free）

repository 層は Worker 内で呼ばれる関数で、独立した request を発生させない。影響なし。

## 3. R2 / KV / Durable Objects

未使用。

## 4. monitoring

`syncJobs.metrics_json` / `auditLog.after_json` のサイズが極端に膨らんだ場合の手段:

- D1 の `length(metrics_json)` を確認する SQL を Phase 11 manual smoke で実行
- 100KB 超は warning（Phase 04 verify-suite F-4 と整合）

## 5. 結論

無料枠への懸念なし。3 ヶ月運用後に再評価する。
