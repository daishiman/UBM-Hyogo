# Phase 9: SSOT 反映

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-9/phase-9.md` |
| 実装区分 | 実装仕様書 |

## 目的
aiworkflow-requirements skill の `references/` / `indexes/topic-map.md` / `indexes/keywords.json` および 起票元 unassigned-task spec への consumed trace 反映先を確定し、書き込み内容のドラフトを設計する。実書き込みは Phase 12 で実施する。CI の `verify-indexes-up-to-date` gate で drift が出ない条件を仕様化する。

## 実行タスク
詳細は `outputs/phase-9/phase-9.md` を正本とする。反映対象は以下:

- `.claude/skills/aiworkflow-requirements/references/database-schema.md`（cursor 列の有無を採用判断結果に応じて追記）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（schema-alias-backfill トピックの状態語彙更新）
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（cursor / remaining-scan / `BACKFILL_CURSOR_MODE` キーワード追加）
- `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md`（consumed marker への書き換え方針確定）

## 統合テスト連携
Phase 12 compliance check で SSOT 反映が漏れないことを確認し、`unassigned-task` の consumed trace を Phase 12 で確定する。

## 参照資料
- `outputs/phase-9/phase-9.md`
- `.claude/skills/aiworkflow-requirements/`
- `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md`

## 成果物
- `outputs/phase-9/phase-9.md`
- 反映先ファイル一覧と書き込み内容ドラフト（仕様確定）

## 完了条件
- 反映対象ファイル 4 件が事前 Read で実在確認済（または新規作成方針が明記）。
- 採用 / 不採用 / 判定保留の 3 分岐に対応した状態語彙ドラフトが確定。
- consumed trace 書き換え方針（Phase 12 で書き換え実行）が明記。
- `pnpm indexes:rebuild` 実行手順と CI gate clean 条件が仕様化。
