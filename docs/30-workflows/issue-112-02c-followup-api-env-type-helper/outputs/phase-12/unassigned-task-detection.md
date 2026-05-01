# unassigned-task-detection.md — 未タスク検出結果

## サマリ

| 項目 | 値 |
| --- | --- |
| 検出件数 | 1 件 |
| 本タスク自体の出自 | 未タスク `docs/30-workflows/unassigned-task/02c-followup-001-api-env-type-and-helper.md` から派生（02c Phase 12 unassigned-task-detection #1） |
| 追加検出 | `docs/30-workflows/unassigned-task/issue-112-followup-001-deployment-cloudflare-split.md`（CONST_002 500行制約違反、本タスク close-out 検証時に検出） |

## 本タスクが既に未タスクから派生したものである旨

本タスク `issue-112-02c-followup-api-env-type-helper` は、02c-d1-repository-foundation の Phase 12 close-out で検出された未タスク #1（`02c-followup-001-api-env-type-and-helper.md`）を Issue #112 として起票し、本ワークフローへ昇格させたもの。したがって本タスクの close-out 時点で **未タスクとして再検出すべき残務は存在しない**。

## 新規未タスク候補

| # | 候補 | 採否 |
| --- | --- | --- |
| 1 | `aiworkflow-requirements/references/deployment-cloudflare.md` を responsibilities 別に責務分離（pre-existing 541 行 + 本タスク +11 行 = 552 行で CONST_002 違反） | **採用**（`unassigned-task/issue-112-followup-001-deployment-cloudflare-split.md` として formalize） |
| - | `wrangler types` 自動生成基盤の整備 | scope out（本タスク Phase 3 代替案 1 で評価済み、small スケールでは過剰投資判定） |
| - | `apps/api/src/env.ts` の field 追加（KV / R2 / HMAC key） | 後続 03a〜05b の各タスク責務として個別に追加されるため、新規未タスク化不要 |
| - | 08-free-database.md への 1 行ポインタ追記 | 同一 wave で反映済み。未タスク化不要 |

## 結論

**1 件**。本タスク close-out 時点で 1 件の未タスクを formalize した（pre-existing tech debt の責務分離）。それ以外の保留していた仕様同期項目は同一 wave で反映済み。
