# UT-17 Cloudflare 使用量アラート 一次対応 runbook

Slack `#ubm-alerts`（または UT-07 で確定する正本 channel）に Cloudflare native
usage alert の日本語通知が届いた際の一次対応フロー。

## トリガー

- relay Worker (`POST /internal/alert-relay`) 経由で Slack に届く以下メッセージ
  - 🚨 [CRITICAL] / ⚠️ [WARNING] のヘッダー
  - メトリクス: Workers リクエスト / D1 読み取り / D1 書き込み / Pages ビルド / R2 Class A 操作

## 一次対応フロー

### WARNING (80% 到達)

1. Slack 通知の「Cloudflare Dashboard で確認」リンクから現状を確認
2. 直近 24h のトラフィックが平常値か確認（bot / クローラ / DDoS 兆候の有無）
3. 異常がなければ翌日の自然減を待ち、発火が継続する場合のみ Step 4 へ
4. 関連 runbook（completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md）の該当メトリクス節を参照し対処

### CRITICAL (95% 到達)

1. **即時** Cloudflare Dashboard で発火元を確認
2. 異常トラフィックなら UT-14 の WAF / Rate Limiting で遮断
3. 自然増なら以下を即時適用:
   - Workers: 低優先 endpoint の一時 degrade（503 返却）
   - D1: クエリ削減 / 不要な full-scan の停止
   - Pages: 当日中の追加 build を停止
   - R2: 大量 list 操作の中止
4. 翌日 0 時の reset で復旧することを確認

## メトリクス別の参照先

| メトリクス | 詳細対処 |
| --- | --- |
| Workers リクエスト | completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md §2-2 |
| D1 読み取り / 書き込み | 同上 §2-3 |
| Pages ビルド | 同上 §2-1 |
| R2 Class A | 同上 §2-5 |

## 通知が届かない場合

→ `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` を参照。

## 記録

CRITICAL 発火時は `postmortem/` 配下に当日付の incident note を作成し、
Slack 通知のスクリーンショット / 対処内容 / 再発防止策を記録する。
