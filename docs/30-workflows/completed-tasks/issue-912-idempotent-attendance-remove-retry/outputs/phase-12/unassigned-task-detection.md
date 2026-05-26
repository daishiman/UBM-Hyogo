# Unassigned Task Detection — issue-912

## 検出結果

| 検出項目 | 件数 | 詳細 |
|---|---|---|
| 新規未タスク | 0 | 本サイクル内で発見した未タスクなし |
| 既存 unassigned-task 参照 | 1 | `docs/30-workflows/unassigned-task/issue-842-followup-002-idempotent-caller-retry-enablement.md`（本タスクのソース。`consumed_by_issue_912_local_implemented_pending_pr` に状態更新済み。commit/PR 完了後に consumed 移動） |

## 詳細

- 本タスクは「冪等 DELETE endpoint × UI caller の opt-in」を 1 サイクルで完結させる設計（CONST_007）
- 後続の **server 側 `Idempotency-Key` 永続化 / dedupe** は既存の `issue-842-followup-003` で別途扱う（新規タスク化不要）
- POST/PATCH caller への retry 適用は型・runtime の二重ガードで構造的に禁止されており、追加タスク化する対象なし

## Consumed source

`docs/30-workflows/unassigned-task/issue-842-followup-002-idempotent-caller-retry-enablement.md` は同サイクルで `consumed_by_issue_912_local_implemented_pending_pr` に更新済み。実装＋PR 完了後に `docs/30-workflows/completed-tasks/unassigned-task/` に移動する（user-gated）。本仕様書の `Refs #912` がトレーサビリティを担保する。
