# Phase 11 manual smoke log

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| タスク | U-UT01-07: sync_log 論理名と既存 sync_job_logs / sync_locks の整合 |
| 作成日 | 2026-04-30 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 主ソース

- 証跡の主ソース: 文書 grep ログ、ファイル存在確認、self-review
- screenshot を作らない理由: NON_VISUAL / docs-only / spec_created のため UI 証跡対象がない
- 実行日時: 2026-04-30
- 実行者: Codex

## 実行ログ

| # | 実行コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | `rg -n "sync_log\\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` | 概念名は注釈付きで判別可能 | 用語説明 / 比較案 / 検証コマンド内の出現のみ | PASS |
| 2 | `rg -n "sync_logs\\b|sync_lock\\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` | 旧揺れ表記の実質違反 0 件 | Before 記述 / 検証コマンド / 期待値説明内の出現のみ。canonical 宣言や採択結果での旧揺れ採用なし | PASS |
| 3 | `rg -n "sync_job_logs|sync_locks" apps/api/migrations/0002_sync_logs_locks.sql` | 物理 2 テーブルの実在確認 | `sync_locks` / `sync_job_logs` の CREATE TABLE と index を確認 | PASS |
| 4 | `rg -n "sync_log\\b|sync_logs\\b|sync_job_logs\\b|sync_locks\\b" .claude/skills/aiworkflow-requirements/references/database-schema.md` | 0 件なら既存記述 drift なし。旧揺れがあれば drift あり | 0 hits。既存記述 drift なし。canonical 追補は UT-04 判定 | PASS |
| 5 | `cd docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation && jq -r '.phases[].artifacts[]' artifacts.json | while read p; do test -f "$p"; done` | artifacts.json 記載成果物が全て実在 | artifact-path-parity PASS | PASS |

## 完了条件

- [x] 実測欄がすべて記入されている
- [x] FAIL がある場合は Phase 12 または未タスク検出へ接続されている
- [x] screenshot を作らない理由が NON_VISUAL として明記されている
