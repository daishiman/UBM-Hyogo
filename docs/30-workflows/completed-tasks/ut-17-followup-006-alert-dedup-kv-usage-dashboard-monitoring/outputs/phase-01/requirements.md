# Phase 1: 要件定義 / Cloudflare API 仕様確認

## 1. 監視対象 (ALERT_DEDUP_KV)

| 観点 | 監視メトリクス | 目的 |
| --- | --- | --- |
| writes | `workers_kv_writes_per_day` | dedup write が想定外に急増していないか（leak / misuse 検知） |
| storage | `workers_kv_stored_data_bytes` | TTL 機能不全による storage 累積を検知 |
| reads | (任意) `workers_kv_reads_per_day` | dedup hit ratio 異常検知（本タスクではスコープ外） |
| latency | Workers Analytics review 項目 | native alert 非対応のため runbook の四半期 deep-dive で確認 |
| error rate | Workers Analytics review 項目 | followup-005 で構造化ログとして別途扱う |

## 2. Cloudflare API 仕様確認結果

- Cloudflare Notification は `billing_usage_alert` で **Account 集計** の usage 系メトリクスを監視できる。namespace 単位の filter は notification policy では持てない（dashboard 側でも namespace filter 無し）
- KV usage は Workers Plan の billing usage に集計され、`workers_kv_*_per_day` 系の metric キーで閾値設定が可能（既存 `workers_requests_per_day` と同枠組み）
- latency / error rate は native notification alert として露出していない。GraphQL Analytics API か Workers Analytics ダッシュボードでの pull 監視となる
- `alert_type` enum 拡張は **不要**。`billing_usage_alert` をそのまま再利用する

## 3. GO / NO-GO 判定

| 項目 | 結果 |
| --- | --- |
| native KV usage alert | あり (`billing_usage_alert`) |
| namespace filter | なし（Account 集計） |
| latency native alert | なし |
| 総合判定 | **CONDITIONAL GO**: Account 集計で UBM-Hyogo の他 KV namespace（現状 `ALERT_DEDUP_KV` のみ）と区別不要。`enabled: false` で repo に置き、staging 擬似発火だけで Slack 経路を証明する |

## 4. quota base 値（2026-05-16 snapshot）

| metric | free tier 値 | 出典 |
| --- | --- | --- |
| `workers_kv_writes_per_day` | 1,000 | https://developers.cloudflare.com/kv/platform/limits/ |
| `workers_kv_reads_per_day` | 100,000 | 同上 |
| `workers_kv_stored_data_bytes` | 1,073,741,824 (1 GiB) | 同上 |

## 5. スコープ確定

- 追加 policy: `workers-kv-writes-per-day`, `workers-kv-stored-bytes` (2 件)
- `workers-kv-reads-per-day` は本タスクではスコープ外（dedup は write 中心 + hit ratio は別観点）
- latency / error rate は runbook 反映のみ
- schema 拡張なし（`alert_type` enum 据え置き）
- lib 変更なし（`canonicalize` / `api-client` 影響なし）
