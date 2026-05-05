# U-UT01-09: Retry / Offset Policy Alignment - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| タスク ID | U-UT01-09 |
| 機能名 | u-ut01-09-retry-and-offset-policy-alignment |
| 作成日 | 2026-04-30 |
| 親タスク | UT-01 |
| 関連タスク | UT-09 / U-UT01-07 / U-UT01-08 |
| github_issue | #263 (CLOSED) |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| docsOnly | true |
| 総 Phase 数 | 13 |

## 概要

UT-01 legacy Sheets→D1 sync の retry / offset policy を canonical 化する設計判断記録タスク。
retry max=3、exponential backoff（base 1s / factor 2 / cap 32s / jitter ±20%）、`processed_offset` chunk index（chunk size=100）を採択。
実コード反映（`DEFAULT_MAX_RETRIES=3`、withRetry cap/jitter、migration、resume）は **UT-09** へ、物理 ledger mapping は **U-UT01-07** へ委譲。
現行 Forms sync / `sync_jobs.metrics_json.cursor` 契約は **上書きしない**。

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1  | 要件定義 | [phase-01.md](phase-01.md) | completed |
| 2  | 設計 | [phase-02.md](phase-02.md) | completed |
| 3  | 設計レビューゲート | [phase-03.md](phase-03.md) | completed |
| 4  | 詳細設計 | [phase-04.md](phase-04.md) | completed |
| 5  | 実装委譲ハンドオーバー | [phase-05.md](phase-05.md) | completed |
| 6  | テスト設計 | [phase-06.md](phase-06.md) | completed |
| 7  | テスト実行 | [phase-07.md](phase-07.md) | completed |
| 8  | 結合検証 | [phase-08.md](phase-08.md) | completed |
| 9  | QA / Manual テスト | [phase-09.md](phase-09.md) | completed |
| 10 | レビュー（technical_go） | [phase-10.md](phase-10.md) | completed |
| 11 | NON_VISUAL 検証 | [phase-11.md](phase-11.md) | completed |
| 12 | システム仕様書反映 | [phase-12.md](phase-12.md) | completed |
| 13 | クローズアウト | [phase-13.md](phase-13.md) | pending_user_approval |

## 関連リソース

| 種別 | パス |
| --- | --- |
| 起票元 unassigned | `docs/30-workflows/completed-tasks/U-UT01-09-retry-and-offset-policy-alignment.md` |
| artifacts | [artifacts.json](artifacts.json) |
| 苦戦記録 | `.claude/skills/aiworkflow-requirements/references/lessons-learned-u-ut01-09-retry-offset-2026-04.md`（L-UUT0109-001〜003） |
| docs-only-closeout-hardening | `.claude/skills/task-specification-creator/changelog/20260430-u-ut01-09-docs-only-closeout-hardening.md` |
| 上書き禁止対象 | `apps/api/src/jobs/sync-forms-responses.ts` の Forms response sync / `sync_jobs.metrics_json.cursor` 契約 |
| 実装委譲先 | UT-09（コード）/ U-UT01-07（物理 ledger）/ U-UT01-08（enum）/ UT-08 monitoring |
