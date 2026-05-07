# Phase 2: cursor 列 schema 設計 / migration 0015 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| Source | `outputs/phase-2/phase-2.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

cursor 候補列（`last_processed_id INTEGER` または `last_processed_pk TEXT`）の型・null 制約・初期値・既存 0014 dedupe / `failed_items_json` との整合戦略を確定し、migration `0015_schema_diff_queue_cursor.sql` の up/down SQL skeleton を設計する。各 row 更新ではなく batch 単位で cursor を確定する方針を schema レベルで担保する。

## 実行タスク

詳細は `outputs/phase-2/phase-2.md` を正本とする。要点:

- cursor 列の型選定（INTEGER vs TEXT）と理由
- NULL 許容 / 初期値 / unique 制約の有無
- 0014 既存列（`dedupe_key` / `failed_items_json` / `retry_count`）との整合
- up SQL（`ALTER TABLE schema_diff_queue ADD COLUMN ...`）と down SQL（カラム削除 or no-op + 補償方針）
- cursor 更新タイミング: 各 row 完了時ではなく batch 完了時にのみ commit（dedupe との競合回避）
- 不採用時の rollback / migration 不発行ポリシー

## 統合テスト連携

Phase 4 の vitest シナリオで、cursor 列の初期値（null）と batch 1 周回後の更新値を assertion する。Phase 7 の migration 実装が本 phase の skeleton と整合することを test で gate する。

## 参照資料

- `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql`
- `apps/api/src/repository/schemaDiffQueue.ts`
- `outputs/phase-1/phase-1.md`

## 成果物

- `outputs/phase-2/phase-2.md`

## 完了条件

- cursor 列の型・制約・更新タイミング・初期化方針が決定し、`0015_schema_diff_queue_cursor.sql` の up/down skeleton が記述されている。
