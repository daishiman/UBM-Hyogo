# Phase 2 成果物: 同期方式比較評価

> **ステータス**: completed-design
> 本ファイルを UT-01 の同期方式選定の正本とする。

## 1. 評価対象方式

| 案 | 方式 | 概要 | 判定 |
| --- | --- | --- | --- |
| A | push（Apps Script webhook） | Sheets 側の Apps Script から Workers エンドポイントを呼ぶ | MAJOR |
| B | pull（Workers Cron Triggers） | Workers が定期実行で Sheets API を読み、差分を D1 に書く | PASS / 採択 |
| C | webhook（Drive API push notifications） | Drive API changes watch を使って通知駆動する | MAJOR |
| D | hybrid（webhook + cron fallback） | webhook を主、cron を補助にする | MINOR / 将来候補 |

## 2. 比較マトリクス

| 観点 | 案 A push | 案 B pull / Cron | 案 C webhook | 案 D hybrid |
| --- | --- | --- | --- | --- |
| トリガー源 | Sheets / Apps Script | Workers scheduled handler | Drive API | Drive API + Workers |
| 即時性 | 高 | 中（既定 6 時間、UT-09 staging で調整） | 高 | 高 |
| 実装コスト | 中 | 低 | 高 | 高 |
| Workers CPU 制限適合性 | 中: 外部からの集中呼び出しで制御しづらい | 高: batch 100 行・再開可能設計で制御可能 | 中: 通知処理と同期処理の分離が必要 | 中: 経路が増える |
| Sheets API quota 適合性 | 低: 編集頻度に依存し予測困難 | 高: cron 間隔と batch で予測可能 | 中: 通知頻度に依存 | 中: fallback と重複読取の抑制が必要 |
| 冪等性確保 | 中: 外部イベント重複の正規化が必要 | 高: `sync_log` / job idempotency key / offset で制御 | 中: 通知重複と期限切れ処理が必要 | 中: 2 経路の重複排除が必要 |
| 障害復旧 | 中: Apps Script 側の失敗記録も必要 | 高: failed log と full backfill が単純 | 中: watch 再登録が必要 | 中: 復旧経路が複雑 |
| 無料枠適合性 | 中: Apps Script 運用境界が増える | 高: Cloudflare Workers Cron + Sheets API で完結 | 低: Drive watch の運用負荷が高い | 中: MVP には過剰 |

## 3. 採択方式

**B: Cloudflare Workers Cron Triggers による定期 pull を採択する。**

採択理由:

1. 同期頻度を Workers 側で制御でき、Sheets API quota（500 req/100s/project）を batch size と cron 間隔で守れる。
2. `sync_log` に job ID / status / processed_offset / retry_count を残せるため、部分失敗後の再開と監査証跡が単純になる。
3. 実装責務が `apps/api` に閉じ、D1 直接アクセス禁止の不変条件と整合する。
4. Backfill を同じ同期関数の `full=true` 分岐で実現でき、UT-09 の実装面積が最小になる。

## 4. 不採択方式の理由

| 案 | 不採択理由 |
| --- | --- |
| A push（Apps Script） | Apps Script 認証境界が増え、Sheets 側イベント重複と Workers 側冪等性を二重に扱う必要がある。MVP では即時性より復旧容易性を優先する。 |
| C webhook（Drive API） | Sheets API には直接の行変更 webhook がなく Drive API watch を経由するため、通知期限・再登録・SLA の設計が増える。 |
| D hybrid | 将来の即時性改善候補としては有効だが、MVP では webhook と cron の重複排除コストが価値を上回る。 |

## 5. 確定パラメータ

| 項目 | 値 | 下流責務 |
| --- | --- | --- |
| 既定 cron 間隔 | `0 */6 * * *`（6 時間ごと） | UT-09 staging で短縮要否を測定 |
| 手動同期 endpoint | `POST /admin/sync` | UT-09 |
| バックフィル endpoint | `POST /admin/sync?full=true` | UT-09 |
| batch size | 100 行 | UT-09 |
| retry | 最大 3 回 | UT-09 |
| backoff | 1s, 2s, 4s, 8s, 16s, 32s 上限 | UT-09 |
| source-of-truth | Sheets 優先、D1 は反映先 | UT-04 / UT-09 |
| D1 物理 schema | UT-04 が migration 化 | UT-04 |

## 6. 既知制約

- Workers CPU / 実行時間制限に備え、1 tick で全件完了を前提にしない。`processed_offset` により次回 tick または手動再実行で再開する。
- Sheets 行の安定 ID がない場合、UT-04 で固有 ID 列または行ハッシュ管理を schema に含める。
- `sync_log` の active lock 相当の一意性は論理要件として本仕様で固定し、物理実現は UT-04 に委譲する。
