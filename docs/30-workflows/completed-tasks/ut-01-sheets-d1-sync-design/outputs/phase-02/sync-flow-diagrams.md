# Phase 2 成果物: 同期フロー図

> **ステータス**: completed-design
> 手動同期 / 定期同期 / バックフィル / エラー処理 / ロールバック判断の正本。

## 1. フロー一覧

| # | フロー | トリガー | 主体 | 失敗時 |
| --- | --- | --- | --- | --- |
| 1 | 手動同期 | 管理者が `POST /admin/sync` | Workers (`apps/api`) | `sync_log.failed` に記録して 4xx/5xx を返す |
| 2 | 定期同期 | Cron Triggers `0 */6 * * *` | Workers scheduled handler | failed log を残し次回 tick で再開 |
| 3 | バックフィル | 管理者が `POST /admin/sync?full=true` | Workers (`apps/api`) | `processed_offset` から再開 |

## 2. フロー図 1: 手動同期

```mermaid
sequenceDiagram
  autonumber
  participant Admin
  participant W as Workers apps/api
  participant S as Sheets API
  participant D as D1
  Admin->>W: POST /admin/sync
  W->>W: 管理者認可を検証
  W->>D: active lock を取得し sync_log=in_progress
  W->>S: spreadsheets.values.get(range)
  S-->>W: ValueRange
  loop chunk 100 rows
    W->>D: UPSERT rows + update processed_offset
  end
  W->>D: sync_log=completed
  W-->>Admin: 200 { jobId, processedRows }
```

エラーパス:

- 401/403: `auth_error` として `failed` に記録し、再試行しない。
- Sheets 5xx / network: 最大 3 回 retry、Backoff 1s→2s→4s→8s→16s→32s。
- quota exceeded: 100 秒以上待機して retry。上限到達時は `quota_exhausted`。
- D1 `SQLITE_BUSY`: chunk 単位で retry。成功済み offset は戻さない。

## 3. フロー図 2: 定期同期（Cron）

```mermaid
sequenceDiagram
  autonumber
  participant C as Cron Trigger
  participant W as Workers scheduled
  participant D as D1
  participant S as Sheets API
  C->>W: scheduled(event)
  W->>D: stale in_progress を failed に遷移
  W->>D: active lock 取得
  alt active lock 取得失敗
    W-->>C: skip（別 job 実行中）
  else lock 取得成功
    W->>S: Sheets rows fetch
    W->>D: batch UPSERT + offset update
    W->>D: completed
  end
```

## 4. フロー図 3: バックフィル

```mermaid
sequenceDiagram
  autonumber
  participant Admin
  participant W as Workers apps/api
  participant D as D1
  participant S as Sheets API
  Admin->>W: POST /admin/sync?full=true
  W->>D: active lock 取得
  W->>D: sync_log trigger_type=backfill, processed_offset=0
  loop until all rows processed
    W->>S: fetch range from processed_offset
    W->>D: UPSERT chunk 100
    W->>D: update processed_offset
  end
  W->>D: completed
  W-->>Admin: 200 { jobId, totalRows }
```

## 5. エラーパス共通図

```mermaid
flowchart TD
  A[同期開始] --> B{認可OK?}
  B -->|No| E1[failed: auth_error / retryなし]
  B -->|Yes| C{active lock取得}
  C -->|失敗| S1[skip: already_in_progress]
  C -->|成功| D[Sheets fetch]
  D -->|quota| R1[Backoff 100s以上 / max 3]
  D -->|5xx/network| R2[Backoff 1-32s / max 3]
  D -->|OK| U[D1 UPSERT chunk 100]
  U -->|SQLITE_BUSY| R3[chunk retry / max 3]
  U -->|mapping_error| E2[failed: 既知列のみ同期可否を記録]
  U -->|OK| O{全行完了?}
  O -->|No| D
  O -->|Yes| Done[completed]
  R1 --> D
  R2 --> D
  R3 --> U
```

## 6. ロールバック判断フローチャート

```mermaid
flowchart TD
  A[障害検知] --> B{障害源}
  B -->|Sheets 一時障害| C[D1 read-only fallback / 書き戻し禁止]
  B -->|D1 書込失敗| D[成功済み offset から retry]
  B -->|D1 破損| E[Sheets から full backfill]
  B -->|Sheets と D1 乖離| F[Sheets 優先で D1 を上書き]
  B -->|双方破損| G[バックアップ復旧を UT-08 手順へ委譲]
  C --> H[sync_log に warning/failed]
  D --> H
  E --> H
  F --> H
  G --> H
```

## 7. UT-09 実装入力チェックリスト

| 項目 | 確定値 |
| --- | --- |
| 採択方式 | Workers Cron Triggers 定期 pull |
| 手動同期 | `POST /admin/sync` |
| バックフィル | `POST /admin/sync?full=true` |
| cron 初期値 | `0 */6 * * *` |
| batch size | 100 行 |
| retry / backoff | 最大 3 回、1s→32s 上限。quota は 100 秒以上待機 |
| SoT | Sheets 優先 / D1 は反映先 |
| open question | 0 件。staging 調整は値変更タスクであり、方式未決ではない |
