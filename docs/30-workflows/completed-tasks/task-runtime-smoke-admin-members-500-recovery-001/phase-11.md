# Phase 11: Evidence inventory

[実装区分: 実装仕様書]

## Phase 11 evidence file inventory

| Classification | Path | Status | 内容 |
| --- | --- | --- | --- |
| staging 500 body | `outputs/phase-02/admin-members-500.txt` | pending | staging 500 body の直接取得結果 |
| staging D1 schema snapshot | `outputs/phase-02/d1-schema-snapshot.txt` | pending | `sqlite_master` + `PRAGMA table_info` 結果 |
| Workers tail | `outputs/phase-02/workers-tail.log` | pending | 500 発生時の tail 出力 |
| local typecheck | `outputs/phase-07/typecheck.log` | present | ローカル typecheck PASS 結果 |
| local lint | `outputs/phase-07/lint.log` | present | ローカル lint PASS 結果 |
| api test | `outputs/phase-07/test.log` | present | api focused test PASS 結果 |
| local admin members curl | `outputs/phase-07/local-curl-admin-members.json` | pending | ローカル 200 確認 |
| staging deploy approval | `outputs/phase-08/user-approval-deploy.txt` | pending | staging deploy 承認 evidence |
| staging deploy log | `outputs/phase-08/deploy.log` | pending | staging deploy 出力 |
| runtime smoke log | `outputs/phase-08/evidence/runtime-smoke.log` | pending | smoke 再実行ログ |
| runtime smoke summary | `outputs/phase-08/evidence/summary.json` | pending | smoke summary JSON |
| smoke body regression test | `outputs/phase-11/evidence/smoke-runner-body-test.log` | present | T-4-5: redacted non-200 body persistence regression test |

> Phase 8 runtime evidence 完了時点で staging/runtime rows を `present` に更新する。runtime rows が `pending` のまま `completed` 昇格は禁止（現状態は `runtime_pending / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）。

## 2. Phase 11 DoD
- 上記 inventory が local present evidence と runtime pending evidence を分離して列挙されている
- local typecheck / lint / api focused test / smoke runner body visibility regression test は present として実コードに反映済み
- Phase 6-8 完了後に status を `present` に書き換えるアクションが明確
