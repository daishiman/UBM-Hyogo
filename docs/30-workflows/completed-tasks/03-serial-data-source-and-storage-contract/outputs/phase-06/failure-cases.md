# Phase 6 / failure-cases.md — 異常系シナリオ集（最低 7 件）

Phase 5 で配置した sync worker / D1 schema を対象とした異常系シナリオ。AC-4（復旧基準=Sheets を真）と整合。

## audit reason enum（不変）

```
SHEETS_RATE_LIMIT
SHEETS_5XX
SHEETS_AUTH
D1_TX_FAIL
MAPPING_INVALID
PARTIAL_ABORT
SCHEMA_DRIFT_IGNORED
```

## A1. Sheets API 429 (rate limit)

| 項目 | 内容 |
| --- | --- |
| 検出 | client.ts の HTTP status==429 |
| 期待挙動 | exponential backoff 1s/2s/4s, 最大 3 回。最終失敗時 `sync_audit.failed_reason='SHEETS_RATE_LIMIT'`, `status='failed'` |
| 検出 SQL | `select audit_id, failed_reason from sync_audit where failed_reason='SHEETS_RATE_LIMIT' order by started_at desc limit 1` |
| 復旧 | scheduled cron の次回実行で自動再試行（Sheets 真原則=AC-4） |

## A2. Sheets API 5xx

| 項目 | 内容 |
| --- | --- |
| 検出 | HTTP 500/502/503/504 |
| 期待挙動 | A1 同様の retry。最終失敗で `failed_reason='SHEETS_5XX'` |
| 検出 SQL | `select count(*) from sync_audit where failed_reason='SHEETS_5XX'` |
| 復旧 | 次回 cron / 観測 alert（05a） |

## A3. Service Account 401 (認証失効)

| 項目 | 内容 |
| --- | --- |
| 検出 | HTTP 401 / 403（Sheets 共有解除含む） |
| 期待挙動 | retry せず即停止、`failed_reason='SHEETS_AUTH'`, `status='failed'` |
| 検出 SQL | `select started_at, failed_reason from sync_audit where failed_reason='SHEETS_AUTH'` |
| 復旧 | 1Password から SA 再取得 → `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON` で rotate。Sheets 共有確認後再 sync |

## A4. D1 transaction 部分失敗

| 項目 | 内容 |
| --- | --- |
| 検出 | batch INSERT で SQL 例外 |
| 期待挙動 | transaction 全体 rollback。`failed_reason='D1_TX_FAIL'`, `status='failed'`, `inserted_count=0` |
| 検出 SQL | `select inserted_count, failed_reason from sync_audit where failed_reason='D1_TX_FAIL'` |
| 復旧 | mapping/型修正後再実行で全件冪等反映。AC-4 に従い必要なら Sheets を真として `member_responses` を truncate-and-reload |

## A5. mapping 不整合（必須欠損 / 型違反）

| 項目 | 内容 |
| --- | --- |
| 検出 | mapping.ts の guard で skip + audit 記録 |
| 期待挙動 | 当該 row のみ skip。他 row は反映。`failed_reason='MAPPING_INVALID'`, `status='partial'` |
| 検出 SQL | `select skipped_count, failed_reason from sync_audit where failed_reason='MAPPING_INVALID'` |
| 復旧 | Sheets 側 row を修正 → 次回 sync で吸収（不変条件 7: Form 再回答が本人更新経路） |

## A6. backfill 中断 → 重複検知

| 項目 | 内容 |
| --- | --- |
| 検出 | truncate-and-reload 中の Worker タイムアウト等で中断 |
| 期待挙動 | `responseId` を冪等キーとし、再開時に既存行は UPSERT で 1 件維持。UNIQUE 違反は test fail |
| 検出 SQL | `select response_id, count(*) c from member_responses group by response_id having c>1` → 0 行であること |
| 復旧 | `diff_summary_json` で resume_from を判定し再 backfill。Sheets 件数と D1 件数の一致を確認 |

## A7. Schema drift（Sheets 列追加）

| 項目 | 内容 |
| --- | --- |
| 検出 | mapping.ts に未知列が現れる |
| 期待挙動 | 既知列のみ反映、未知列は `extra_fields_json` に保持。`failed_reason='SCHEMA_DRIFT_IGNORED'`, `status='success'`（不変条件 1） |
| 検出 SQL | `select failed_reason, count(*) from sync_audit where failed_reason='SCHEMA_DRIFT_IGNORED' group by failed_reason` |
| 復旧 | Phase 12 spec sync で正本仕様（01-api-schema.md / data-contract.md）を更新 |

## 整合性確認

| AC | 関連シナリオ |
| --- | --- |
| AC-1 (source-of-truth 一意) | 全シナリオで Sheets が真 |
| AC-2 (manual/scheduled/backfill 分離) | A6 |
| AC-3 (runbook) | A4 / A6 |
| AC-4 (復旧=Sheets 真 / D1 再構築) | A4, A6 全シナリオ |
| AC-5 (純 Sheets 案非採用) | 全シナリオで D1 投影が必要となる根拠 |

## 観測項目（05a observability への handoff）

- `sync_audit.status='failed'` 直近 24h カウント
- `reason` 別 distribution
- backfill 経路の duration
- Sheets API HTTP code 別カウント
