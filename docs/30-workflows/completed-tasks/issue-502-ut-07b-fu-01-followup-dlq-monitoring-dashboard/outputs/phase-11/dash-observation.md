# Cloudflare dash 観測手順 trace（NON_VISUAL / テキスト記録）

> 取得日: 2026-05-07 / 形式: 手動 dash 観測の手順テキストのみ（screenshot 不要 / NON_VISUAL）

## 観測経路

1. `bash scripts/cf.sh whoami` で認証成功を確認（trace は `cf-whoami.log` を別途 tee する）
2. Cloudflare dash > Workers & Pages > Queues > 該当 queue を選択
   - production: `schema-alias-backfill`
   - staging: `schema-alias-backfill-staging`
3. Metrics タブで以下を 24h / 7d レンジで確認
   - Messages produced
   - Messages consumed
   - Dead-lettered messages
   - Retries
4. DLQ を選択し dead-letter messages の滞留有無を確認
   - production DLQ: `schema-alias-backfill-dlq`
   - staging DLQ: `schema-alias-backfill-staging-dlq`
5. 異常検知時は runbook §4 のしきい値判定 → §5 エスカレーション分岐へ進む

## フォールバック

Workers Analytics / Queue Metrics が Workers Paid feature 限定で参照不可の場合:

- `bash scripts/cf.sh queues list` で Queue 一覧を CLI 経由で取得
- D1 集計 SQL（runbook §3）のみで運用継続（永続 evidence は `schema_diff_queue` 側に揃うため AC-1〜AC-4 維持）

## 本タスクでの実 dash 到達

本仕様書は docs-only / spec formalization が責務範囲。dash 実画面到達はユーザー承認下の手動運用とし、本 trace は **手順の正本化のみ**を担う。
