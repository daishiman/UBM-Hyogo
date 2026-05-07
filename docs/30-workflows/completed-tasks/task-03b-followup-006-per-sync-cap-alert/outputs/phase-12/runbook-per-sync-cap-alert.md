# Runbook: per-sync write cap 連続到達アラート（task-03b-followup-006 / Issue #199）

## 概要

`apps/api/src/jobs/sync-forms-responses.ts` の per-sync write cap (`RESPONSE_SYNC_WRITE_CAP`、既定 200) に直近 3 回連続で到達した場合、Cloudflare Analytics Engine binding `SYNC_ALERTS` (dataset = `sync_alerts` / staging は `sync_alerts_staging`) に `sync_write_cap_consecutive_hit` event が emit される。本 runbook は受信時のオペレータ手順を定義する。

## イベント payload 契約

| フィールド | 値 |
| --- | --- |
| `blobs[0]` | `"sync_write_cap_consecutive_hit"` |
| `blobs[1]` | `jobKind`（現時点では `"response_sync"` のみ） |
| `doubles[0]` | `consecutiveHits`（既定 3） |
| `doubles[1]` | `windowSize`（既定 3） |
| `indexes[0]` | `jobId`（最新の cap hit job の UUID） |

PII 不混入: payload には emailaddress / questionId / responseId は含まない。`jobId` は内部生成 UUID で個人特定性なし。

## 1. 連続 cap hit 検知時の初動 5 分

1. Analytics Engine の `sync_alerts` dataset を確認し、当該 `jobId` を控える。
2. `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT job_id, started_at, finished_at, metrics_json FROM sync_jobs WHERE job_type='response_sync' ORDER BY started_at DESC LIMIT 5"` で直近 5 件を確認し、`writeCapHit=true` 連続を裏付ける。
3. `metrics_json.writes` が cap (既定 200) と一致しているかを確認する。

## 2. バックログ滞留判定

```sql
SELECT count(*) AS pending
FROM member_responses
WHERE submitted_at > (
  SELECT json_extract(metrics_json, '$.cursor')
  FROM sync_jobs
  WHERE job_type='response_sync' AND status='succeeded'
  ORDER BY started_at DESC LIMIT 1
);
```

`pending` が大きい場合は Forms 回答急増、または cron 間隔不足が示唆される。

## 3. Forms 回答急増判定

- Google Forms 管理画面で当日回答数を確認する。
- 直近 24h で 200 × 96 = 19,200 件を超えている場合は cap 解除またはバッチ並列化を要検討（本タスク scope 外、03b 本体側へ起票）。

## 4. cron 間隔の暫定調整判断

- 本タスクでは cron 設定変更を実装しない（observability 側責務分割のため）。
- 暫定対応として `apps/api/wrangler.toml` の `*/15 * * * *` を `*/5 * * * *` に変更する判断を Stage 2 以降で検討する。Cloudflare account の cron quota（free tier 5 cron/account）を必ず先に確認する。

## 5. D1 無料枠影響評価

| 指標 | 値 |
| --- | --- |
| Per-sync write 上限 | 200 |
| Cron 周期 | 15 分（96 回/日） |
| 上限到達時の write/day | 19,200 |
| D1 free tier write/day | 100,000 |
| 占有率 | 19.2% |

cap 解除した場合の試算:

| Per-sync 上限 | write/day | 占有率 |
| --- | --- | --- |
| 200（現状） | 19,200 | 19.2% |
| 500 | 48,000 | 48.0% |
| 1000 | 96,000 | 96.0% ⚠ |

cap を解除する場合、cron 間隔の同時調整 + D1 paid plan への移行可否評価が前提。

## 6. Escalation 階段

| Stage | 連続 hit 数 | 経過時間目安 | アクション |
| --- | --- | --- | --- |
| Stage 1 | N=3 | 45 分 | Issue #199 へ調査ノート追記。GitHub issue 自動起票候補は 05a-parallel-observability で実装。 |
| Stage 2 | N=6 | 90 分 | メール通知候補（同上）。 |
| Stage 3 | N=12 | 180 分 | Slack 通知候補（MVP では抽象化のみ）。 |

## 7. アラート停止確認

- 連続 cap hit が解消（直近 3 件のいずれかが `writeCapHit=false`）すると `previousWindowReached=false` 条件が次回再到達まで再びリセットされる。
- 連続中の重複 emit は detector 側で抑制されるため、Stage 1 emit は 1 サイクル 1 回のみ。

## 8. Rollback

緊急時は `apps/api/wrangler.toml` の `[[analytics_engine_datasets]]` ブロックをコメントアウトし `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` で再 deploy する。検知ロジック自体は `SYNC_ALERTS` binding 未定義時に `console.warn` で握り潰すため、binding の除去のみで安全に停止できる。cap 値や cron 設定は変更しない。

## 9. Ownership 境界

本 runbook は検知 / 初動 / D1 影響評価のみを扱う。通知チャネル実装（GitHub issue auto-creation / mail / Slack）と cron 間隔調整は 05a-parallel-observability-and-cost-guardrails の責務。

## 10. 関連リンク

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/199
- 仕様 SSOT: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` per-sync write cap 連続到達アラート節
- 実装: `apps/api/src/jobs/cap-alert.ts`, `apps/api/src/jobs/sync-forms-responses.ts`
- テスト: `apps/api/src/jobs/cap-alert.test.ts`, `apps/api/src/jobs/sync-forms-responses.test.ts`
