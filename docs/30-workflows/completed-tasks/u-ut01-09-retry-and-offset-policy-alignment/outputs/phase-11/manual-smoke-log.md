# Phase 11 Manual Smoke Log

> 本ファイルは spec walkthrough / link 検証 / canonical cross-reference の実行ログ。
> 実施日時: 本仕様書執行時に Phase 11 タスクで記録される。
> 本タスクは docs-only のため、smoke は spec 整合チェックに限定される。

---

## 1. 必須メタ

| 項目 | 値 |
| --- | --- |
| 証跡の主ソース | spec walkthrough |
| screenshot を作らない理由 | NON_VISUAL / docs-only / spec_created |
| 実行日時 | 2026-04-30（本タスク実行時） |
| 実行者 | 現 worktree 実行者（task-20260430-192142-wt-9） |

## 2. 実行ログ

| # | 観点 | 実行コマンド / 確認方法 | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 1 | quota 再計算 | `outputs/phase-09/quota-worst-case-calculation.md` §3 集約表を独立再計算 | 500 req/100s 未満 | 2 req/100s = 0.4% | PASS |
| 2 | 参照存在確認 (UT-01) | `ls docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/` | sync-method-comparison.md / sync-log-schema.md 存在 | 存在 | PASS |
| 3 | 参照存在確認 (実装) | `ls apps/api/src/jobs/sync-sheets-to-d1.ts` | 存在 | 存在 | PASS |
| 4 | 参照存在確認 (migration) | `ls apps/api/migrations/0002_sync_logs_locks.sql` | 存在 | 存在 | PASS |
| 5 | canonical cross-reference | Phase 2 / 5 / 7 / 9 / 10 で retry=3, base 1s, cap 32s, jitter ±20%, offset chunk index が一致 | 値 drift 0 | drift 0 | PASS |
| 6 | 既存実装差分 | `apps/api/src/jobs/sync-sheets-to-d1.ts:49` の `DEFAULT_MAX_RETRIES` 値 | 5（既存差分が確認できる） | 5 | PASS（差分検出済み）|
| 7 | migration 列不在 | `apps/api/migrations/0002_sync_logs_locks.sql` 内 `processed_offset` の有無 | ABSENT | ABSENT | PASS（差分検出済み）|

## 3. 分類欄（リアルタイム分類）

| # | 発見事項 | 分類 | 対応方針 |
| --- | --- | --- | --- |
| - | （なし） | - | - |

本実行では Blocker 0 / Note 0 / Info 0。

## 4. 申し送り（Phase 12 へ）

- canonical 値の cross-reference は drift 0 で確定
- UT-09 / U-UT01-07 / U-UT01-08 への申し送りファイル全て生成済
- open question は Phase 12 unassigned-task-detection.md に転記
