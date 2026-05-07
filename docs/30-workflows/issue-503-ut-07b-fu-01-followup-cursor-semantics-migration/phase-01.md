# Phase 1: 要件定義 / GO 判定 / cursor 採用判断フレームワーク確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| Source | `outputs/phase-1/phase-1.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

remaining-scan vs cursor の比較に必要な evidence 種別（CPU 時間 / 残行数 / retry_count / `EXPLAIN QUERY PLAN`）と、採用判断のしきい値を SSOT として確定する。public API `backfill.status` の語彙拡張は禁止スコープであることを明文化し、Phase 2（cursor 列 schema 設計）着手の GO/NO-GO を判定する。

## 実行タスク

詳細は `outputs/phase-1/phase-1.md` を正本とする。要点:

- evidence 4 種（CPU 時間平均・残行数推移・retry_count 増分・query plan 種別）を確定
- 採用判断しきい値表（cursor 採用条件 / 不採用条件 / 判定保留条件）を確定
- 上流依存（UT-07B-FU-01 current state）の前提確認手順を定義
- 含む / 含まないスコープを最終固定（API contract 不変を不可侵条件として明記）

## 統合テスト連携

Phase 4 の vitest シナリオで、shadow flag による経路分岐が `backfill.status` の API contract に影響しないことを assertion で検証する。

## 参照資料

- `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md`
- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts`

## 成果物

- `outputs/phase-1/phase-1.md`

## 完了条件

- 採用判断しきい値表が SSOT として確定し、evidence 4 種と禁止スコープ（API contract 不変）が文書化されている。
