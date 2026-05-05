# Phase 12 Output: Unassigned Task Detection

本書は「0 件でも出力必須」ルールに従って常時出力する。本タスクは docs-only / legacy umbrella close-out であり、新規 implementation タスクの起票は行わない。検出対象は派生 implementation ではなく、後続独立タスク U02 / U04 / U05 の **既起票確認** と新規派生有無の判定である。

## 検出マトリクス

| # | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 / 既起票 |
| --- | --- | --- | --- | --- |
| 1 | audit table（`sync_audit_logs` / `sync_audit_outbox`）の最終要否判定 | 設計判断 | `sync_jobs` ledger でカバー可能か精査し新設可否を確定 | UT21-U02 `task-ut21-sync-audit-tables-necessity-judgement-001`（**既起票** / `docs/30-workflows/unassigned-task/`） |
| 2 | 実 secrets / 実 D1 環境での manual smoke | 検証 | staging 実環境で Bearer / 409 / D1 retry / metrics_json を実測 | UT21-U04 `task-ut21-phase11-smoke-rerun-real-env-001`（**既起票**）+ 09b runbook |
| 3 | 実装パス境界（UT-21 想定 `apps/api/src/sync/{core,manual,scheduled,audit}` vs 現行 `apps/api/src/jobs/*` + `apps/api/src/sync/schema/*`）と runtime cron / wrangler stale Sheets 設定の整理 | 設計 / リファクタ / runtime configuration | 現行構成を正本確定し、`apps/api/wrangler.toml` と deployment specs の Sheets sync cron / `runSync` / Sheets API v4 表現を撤回・維持・Forms sync 置換に分類 | UT21-U05 `task-ut21-impl-path-boundary-realignment-001`（**既起票** / 本レビューで scope 追補） |
| 4 | 03a / 03b / 04c / 09b の受入条件への patch 適用（Bearer guard / 409 排他 / D1 retry / manual smoke） | 実作業 | Phase 5 implementation-runbook の patch 案を各タスクに反映 | 既存 03a / 03b / 04c / 09b（**本 close-out では cross-link のみ**。実 patch 適用は各タスクの Phase 内） |
| 5 | aiworkflow-requirements `task-workflow.md` current facts 追記 | docs 同期 | Phase 12 Step 1-A の固定文言で適用 | 本 PR 内（追加タスク不要） |
| 6 | UT-21 当初仕様書（legacy）の状態欄パッチ | docs 同期 | 「legacy / close-out 済 / Forms sync 正本」を line 11 / 14 付近に追記 | 本 PR 内（追加タスク不要） |
| 7 | 04c index.md がワークツリーに未存在の場合の cross-link 漏れ | 委譲 | 04c 起票時に本 close-out への cross-link を追記する指示を documentation-changelog に残置 | 04c タスク起票担当（未起票時は委譲扱い） |
| 8 | 該当なし（新規 IMPL タスク） | — | — | **該当なし**（既存 03a/03b/04c/09b + U02/U04/U05 で網羅。新規起票 0 件） |

## 0 件判定の根拠

- 価値要件 4 種（Bearer guard / 409 排他 / D1 retry / manual smoke）は全て既存タスクへ移植先割当済（AC-2 / Phase 2 移植マトリクス参照）
- audit table / endpoint 新設は禁止方針が成果物そのもの（Phase 2 no-new-endpoint-policy 参照）
- 実装パス再編 / runtime cron・wrangler stale Sheets 設定整理 / 実環境 smoke / audit 要否判定は U05 / U04 / U02 で既起票
- したがって本タスクから派生する新規 implementation タスクは **0 件**

## Phase 13 引き渡し

- PR body の「関連タスク」欄に U02 / U04 / U05 の link を転記
- 「新規派生 IMPL タスク 0 件」を PR 説明に明示し、reviewer による誤起票を予防
