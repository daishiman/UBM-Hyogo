# unassigned-task-detection.md

> Task 12-4: 未タスク検出レポート（**0 件でも出力必須**）。

## 検出件数

- 検出件数: 10 件（U-1〜U-10）

## SF-03 4 パターン照合

| パターン | 結果 |
| --- | --- |
| 型定義 → 実装 | UT-09（同期ジョブ実装） / UT-04（D1 物理スキーマ）に引き継ぎ済（既存タスクで吸収） |
| 契約 → テスト | UT-09 Phase 4 で test-strategy 確定（本タスク Phase 4 では設計検証戦略の骨格まで） |
| UI 仕様 → コンポーネント | 該当なし（本タスクは UI 変更なし） |
| 仕様書間差異 → 設計決定 | TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01 / 既存実装差分を本 Phase で記録（U-1〜U-10 として未タスク化または吸収先明示） |

## 検出された未タスク候補

| ID | 候補タスク | 根拠 | 優先度 | 起票時期 |
| --- | --- | --- | --- | --- |
| U-1 | hybrid（webhook + cron fallback）方式の将来評価タスク | TECH-M-01。base case B 安定後の拡張オプションとして MINOR 残置。即時性 SLA が必要になった場合に備える | LOW | post-merge（任意 / UT-09 安定後） |
| U-2 | Cron 間隔の staging 測定タスク | TECH-M-02。6h / 1h / 5min を UT-09 staging で実測し最適粒度を確定 | MEDIUM | UT-09 内で吸収（独立化はオプション） |
| U-3 | partial index の D1 サポート確認 / 代替設計タスク | TECH-M-03。D1 が partial index を未サポートの場合の代替（通常 index + WHERE クエリ）の最終決定 | LOW | UT-04 / Phase 4 内で吸収可 |
| U-4 | sync_log 保持期間 / 監視連動タスク | TECH-M-04。保持期間と UT-08 監視 / アラートの連動方針確定 | LOW | UT-08 と連動 |
| U-5 | DRY 構造化解消の再確認 | TECH-M-DRY-01。Phase 8 で完了済みだが、Phase 12 で解決済みとして明示する必要がある | LOW | 本 Phase で吸収済み（documentation-changelog に記録） |
| U-6 | GCP quota 配分 / Service Account 申し送り | MINOR-M-Q-01。Google Sheets API quota を他用途と共有する場合の配分確認が UT-03 に必要 | MEDIUM | UT-03 へ申し送り |
| U-7 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合タスク | 30種思考法レビュー。既存 migration は `sync_job_logs` / `sync_locks` を作成済みで、UT-01 の `sync_log` 新設と二重 ledger 化する恐れ | HIGH | UT-09 / UT-04 再同期タスクとして formalize |
| U-8 | sync 状態 enum / trigger enum の統一タスク | 仕様は `pending|in_progress|completed|failed` / `manual|cron|backfill`、既存実装は `running|success|failed|skipped` / `admin|cron|backfill` | HIGH | shared 契約または UT-09 仕様追補で canonical set を決定 |
| U-9 | retry 回数と offset resume 方針の統一タスク | 仕様は retry 最大 3 回 + `processed_offset`、既存実装は `DEFAULT_MAX_RETRIES=5` かつ offset カラムなし | HIGH | UT-09 実装追補 / 設計差分レビュー |
| U-10 | shared sync 契約型 / Zod schema 化タスク | `packages/shared` に `SyncLogStatus` / `SyncTriggerType` / `SyncLogRecord` 相当がなく、UT-04 / UT-09 の契約ドリフト余地がある | MEDIUM | packages/shared 契約化を別タスク化 |

## ソース別検出記録

| ソース | 確認結果 |
| --- | --- |
| 元タスク仕様書（unassigned-task/UT-01-sheets-d1-sync-design.md） | スコープ外明示項目: 実装・物理 schema・認証実装・通知・監視・E2E（すべて既存タスクへ引き継ぎ済） |
| Phase 3/10 レビュー結果 | MINOR 6 件（TECH-M-01〜04 / TECH-M-DRY-01 / MINOR-M-Q-01）→ U-1〜U-6 として転記。TECH-M-DRY-01 は Phase 8 吸収済み |
| Phase 11 手動 smoke | スコープ外発見事項 0 件（S-1〜S-6 すべて PASS / Broken link 0 / mirror diff 0 / 残置 open question 0） |
| コードコメント | 本タスク自体はコード変更なし。ただし既存 `apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql` と論理設計の差分を U-7〜U-9 として記録 |
| `describe.skip` ブロック | 該当なし（テストコード変更なし） |

## 必須セクション（4 種）— 各 U-N 起票時に記入

各 U-N が個別タスク仕様書として起票されるとき、以下 4 セクションを必ず含める:

- 苦戦箇所【記入必須】
- リスクと対策
- 検証方法
- スコープ（含む / 含まない）

> 本ファイル時点では候補リストのみ。各 U-N の詳細は post-merge で別 issue 化する際に確定する。

## 検出 0 件宣言が成立しない理由

「0 件でも出力必須」のルールを満たすため本ファイルを出力しているが、本タスクでは Phase 10 MINOR 6 件と既存実装差分 4 件が検出されたため非 0 件として記録する。
