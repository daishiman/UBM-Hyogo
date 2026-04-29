# Failure Cases — 03b Forms Response Sync

| # | シナリオ | 検出 | 振る舞い | 副作用 / リカバリ | テスト |
|---|---------|------|----------|-------------------|--------|
| F-01 | `forms.responses.list` が 503 | `client.listResponses` throw | `classifyError → FORMS_5XX` / `sync_jobs.failed` | lock release / 次回 cron で再試行 | `sync-forms-responses.test.ts` "失敗系" |
| F-02 | `forms.responses.list` が 429 | 同上 | `classifyError → QUOTA_EXCEEDED` | 次回 cron まで放置 / metrics.errorCount 増 | classifyError 経路（unit 想定） |
| F-03 | OAuth 401/403 | 同上 | `FORMS_AUTH` | secrets を疑う / ledger に error_json | classifyError 経路 |
| F-04 | 不正な `pageToken` | `INVALID_PAGE_TOKEN` | `CURSOR_INVALID` / `failed` | admin で `?fullSync=true` 起動して復旧 | classifyError 経路 |
| F-05 | 同種 sync 重複起動 | `tryAcquireResponseSyncLock` が UNIQUE 失敗 | `'skipped'` / route 409 | 後続 cron でリトライされる | `sync-forms-responses.test.ts` AC-6 / route AC-6 |
| F-06 | 個別 response の DB write 例外 | `processResponse` 内 throw | 当該 1 件 skip / `metrics.errorCount++` | loop 継続 / cursor は進む | （logging 検証は手動） |
| F-07 | unknown question 重複 enqueue | `enqueueDiff` で UNIQUE 失敗 | try/catch で no-op | DB の partial UNIQUE で idempotent | AC-2 |
| F-08 | `is_deleted=1` identity の再回答 | `findStatusByMemberId.is_deleted===1` | `setConsentSnapshot` を skip | retention 維持 / current_response は更新 | AC-9 |
| F-09 | `RESPONSE_SYNC_WRITE_CAP` 到達 | writeCount 監視 | break / `succeeded` + cursor 残存 | 次回 cron で続き | AC-10 |
| F-10 | brand 型混同 | TypeScript 段階 | コンパイル拒否 | runtime 不可達 | AC-7 type test |
| F-11 | submittedAt 同点 + responseId 同点 | 構造的に発生し得る場合は同一値 | `decideShouldUpdate → false`（変化なし） | 冪等 | T-U-02 |
| F-12 | `responseEmail` 欠落 | `processResponse` 冒頭 guard | response 全体を skip / job は succeeded 続行 | 警告 log / metrics 進める | guard 経路（実装あり） |
| F-13 | `sync_locks` TTL 切れ放置 | TTL 30min 経過 + 新 job 開始 | `DELETE FROM sync_locks WHERE expires_at < now()` で掃除 | 自動復旧 | 動作前提 |
| F-14 | DB write timeout | `processResponse` 内 throw | F-06 と同経路 | 個別 skip / errorCount 増 | classifyError → DB_TIMEOUT |

## 拾えていない / 受け入れる残存リスク

- `forms.responses.list` の **部分的破損**（一部 response が schema 違反）: `normalizeResponse` で `unknown` 側に落ちる、もしくは zod 由来の Error が F-06 に集約される
- `member_responses.search_text` の整形は本タスク範囲外（08b で扱う）。本タスクでは passthrough
- 02b で計画する **email 衝突** は本タスクで起きない構造（identity は email で 1 行）。`EMAIL_CONFLICT` 分類は将来の admin merge ジョブ向けの予約コード
