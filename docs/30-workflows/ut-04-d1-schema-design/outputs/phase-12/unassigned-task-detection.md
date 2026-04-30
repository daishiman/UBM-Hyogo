# unassigned-task-detection — UT-04 D1 データスキーマ設計

> 0 件でも出力必須（phase-12-pitfalls.md「未タスク検出レポートで 0 件判定のまま未修正」対策）。
> Phase 10 MINOR 指摘の formalize を含む。

## 検出件数: 6 件（formalize 対象）

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 | 元出典 |
| --- | --- | --- | --- | --- | --- |
| 1 | TypeScript 型生成（DDL → zod schema 連動） | 実作業 | DDL から型派生する自動化を別タスクで設計 | `docs/30-workflows/unassigned-task/task-ut-04-shared-zod-codegen.md` | Phase 12 spec / CLAUDE.md 不変条件 #1 |
| 2 | seed data 投入手順の整備 | 実作業 | dev fixture / production 初期データの規約 | `docs/30-workflows/unassigned-task/task-ut-04-seed-data-runbook.md` | Phase 11 既知制限 #6 派生 |
| 3 | sync_job_logs / sync_locks との結合確認 | 設計 | UT-09 の追加テーブルとの整合性レビュー | `docs/30-workflows/unassigned-task/task-ut-04-sync-ledger-transition-plan.md` | Phase 10 MINOR |
| 4 | backup / export 自動化（D1 export の cron 化） | 運用 | `bash scripts/cf.sh d1 export` の定期実行 | UT-26 staging-deploy-smoke / 新規 unassigned 候補 | Phase 11 既知制限 #5 派生 |
| 5 | FOREIGN KEY 有効化（`PRAGMA foreign_keys = ON`）の実行時保証 | 検証 | migration 先頭宣言 + アプリ起動時 health check | UT-04 実装フェーズ | Phase 11 S-5 |
| 6 | マイグレーション番号衝突防止（dev/main 並行開発） | 運用 | `0001_*` 連番調整ルールの明文化 | UT-04 実装フェーズ | Phase 5 runbook 派生 |

## Phase 10 MINOR 指摘 formalize（対応済み内訳）

| MINOR # | 指摘内容 | formalize 結果 |
| --- | --- | --- |
| MINOR-1 | sync_job_logs / sync_locks の整合 | 上記 #3 として UT-09 へ register |
| MINOR-2 | field-level 暗号化は MVP 不採用だが、将来導入可能性を記録 | Phase 11 既知制限 #4 として記録済み（本表外） |
| MINOR-3 | audit_logs retention の自動削除 | Phase 11 既知制限 #5 として記録済み（運用化は UT-08） |

## 該当なし扱いの確認

- 「該当なし」セクション: 本タスクでは 6 件の検出があるため空欄ではない。ただし spec_created タスクの実装 wave で **新規追加で発見されない場合に備え** 0 件時テンプレも参照可能とする。
- 0 件出力テンプレ参考: `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-12/unassigned-task-detection.md`

## 委譲先タスクの実在性

| 候補先 | 実在性 | 行先処置 |
| --- | --- | --- |
| task-ut-04-shared-zod-codegen.md | 作成済み | DDL→型派生の別タスクとして管理 |
| task-ut-04-seed-data-runbook.md | 作成済み | seed / fixture runbook の別タスクとして管理 |
| task-ut-09-member-responses-table-name-drift.md | 作成済み | UT-09 の主テーブル名 drift を別タスクとして管理 |
| task-ut-04-sync-ledger-transition-plan.md | 作成済み | `sync_jobs` / `sync_job_logs` / `sync_locks` 共存方針を別タスクとして管理 |
| UT-26 | 既存 | backup 自動化を関連スコープに追加 |
| UT-04 実装フェーズ | 既存 | UT-04 自身の実装 PR で対応 |
