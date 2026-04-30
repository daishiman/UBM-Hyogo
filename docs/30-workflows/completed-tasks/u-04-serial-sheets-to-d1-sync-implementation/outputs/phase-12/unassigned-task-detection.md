# Phase 12 Task 4: 未タスク検出

## 検出結果

| ID | 内容 | 影響 | 対応 |
| --- | --- | --- | --- |
| 09B-SYNC-RUNNING-ALERT | `sync_job_logs.status='running'` が 30 分以上残った場合の alert / dashboard | 中 | 既存下流 09b cron monitoring に relay。新規未タスクは作らない |
| 05B-STAGING-SMOKE | staging manual / scheduled smoke の実機実行 | 中 | 既存下流 05b smoke readiness に relay。新規未タスクは作らない |
| 07B-SCHEMA-DRIFT | Sheets 列追加時の alias 受入判定 | 中 | 既存 07b form schema diff に relay。新規未タスクは作らない |
| DOC-LINE-BUDGET | aiworkflow-requirements reference 5 ファイルが `validate-structure.js` で 500 行超過 warning | 低 | `docs/30-workflows/unassigned-task/task-docs-aiworkflow-reference-line-budget-split-001.md` を作成 |

## TODO / skip scan

| 対象 | 結果 |
| --- | --- |
| `apps/api/src/sync/**` TODO/FIXME/HACK/XXX | 0 件 |
| `apps/api/src/sync/**` `describe.skip` / `it.skip` | 0 件 |
| workflow docs 内 TODO | Phase 10 failure-mode の「ESLint custom rule 強化」は将来改善メモ。既存方針の範囲で新規未タスク化しない |

## Phase 3 MINOR / review 指摘の処理

| ID | 内容 | 処理 |
| --- | --- | --- |
| TECH-M-01 | mutex race | `sync_locks` + `withSyncMutex` で実装済み。09b で長時間 running alert を監視 |
| TECH-M-02 | scheduled 同秒 / timestamp cursor drift | 実装を毎時全件 upsert 方針へ変更し、cursor drift による取りこぼしを回避 |
| TECH-M-03 | audit finalize 漏れ | `withSyncMutex` で finalize 失敗を failed result に反映し、startRun running insert 失敗時は lock cleanup |
| TECH-M-04 | wrangler dispatch 依存 | `runbook-final.md` / `manual-test-result.md` に cron 一時短縮代替を記録。09b へ relay |
| TECH-M-06 | 旧 `POST /admin/sync` 互換 mount | 互換 endpoint は残し、正本は `/admin/sync/run` として api-endpoints に明記。削除は互換性影響があるため新規未タスク化しない |

## テスト証跡の分離

| 範囲 | 最新結果 |
| --- | --- |
| typecheck | PASS（Node 22 では Node 24 required warning あり） |
| u-04 focused tests | 実行対象: `audit/backfill/scheduled/sheets-client/routes/admin/sync`。package script は apps/api 全体を走らせるため、結果は Phase 12 最終検証で更新 |
| API full suite | 直前の全体実行で `forms-schema-sync.test.ts` timeout が一度発生。再実行では同 test が PASS したため、環境負荷由来の flake と扱い、最終結果を compliance に記録 |

## 判定

新規未タスク作成は 1 件。
U-04 固有の大きな未解決事項は既存下流タスクへ relay 済み。今回の検証で可視化された reference line budget warning は別 backlog として formalize 済み。
