# Phase 10 — 運用・監視

## 既存 audit log を継続利用

| event | source | 確認方法 |
| --- | --- | --- |
| `admin.tag.queue_resolved` | `apps/api/src/workflows/tagQueueResolve.ts` で発火 | staging で drawer から confirmed → D1 `audit_log` テーブルを `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --command "SELECT * FROM audit_log WHERE event='admin.tag.queue_resolved' ORDER BY created_at DESC LIMIT 5"` で確認 |

UI 変更だけで API 側の audit emit に手を入れていないため、観測可能性は既存のまま。

## 新規 dashboard 不要根拠

- mutation rate / error rate / latency は既存 Cloudflare Workers analytics で endpoint 単位に観測済
- frontend a11y 違反は CI の axe gate でゲートされ運用後はゼロ前提
- queue depth / dlq 件数の専用 dashboard 化は別 task（unassigned 候補）

## アラート

| 種別 | 判定基準 | 通知先 |
| --- | --- | --- |
| `/admin/tags/queue/:id/resolve` 5xx | 5 分間 5 件以上 | 既存 Workers alerting に乗る（本 task では新規追加なし） |
| audit_log 書き込み失敗 | workflow 内のエラーログ | 既存 logpush |

## 監視項目チェックリスト

- [ ] staging で drawer 経由 confirmed → `audit_log` 行が +1 増える
- [ ] staging で drawer 経由 rejected → `audit_log` 行が +1 増える（reason 付き）
- [ ] terminal status item では mutation 不発（4xx 発生せず client gate で止まる）
