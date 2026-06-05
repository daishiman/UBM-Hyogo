# Unassigned Task Detection

current（本タスク派生の未タスク）と baseline（既存・周辺の未タスク）を分離して記録する。

## current（本タスク派生・最低 1 件）

| # | 未タスク | 区分 | 検出理由 |
| --- | --- | --- | --- |
| C-1 | result 2 状態（all-success / partial-failure）の **認証付き staging mutation baseline 取得** | improvement / existing unassigned | 本タスクは picker 2 状態のみ read-only でスコープ。result 状態の実機取得は副作用ありゆえ既存未タスクに残した |

### C-1 詳細

| 項目 | 内容 |
| --- | --- |
| 内容 | 認証付き staging `/admin/members` で実 `POST /admin/members/tags/bulk` を実行し `bulk-tag-result-all-success.png` / `bulk-tag-result-partial-failure.png` baseline を取得 |
| スコープ外にした理由 | staging 共有 D1 への破壊的副作用（mutation）が不可避。本サイクル内で実行すると共有 staging データの整合性破綻を招く（CONST_005 例外） |
| 機能担保の現状 | result summary の描画は API レスポンス shape から純粋に決まり、`BulkActionBar.spec.tsx` TC-BAB-TAG-03（component spec）+ 親 local fixture baseline で既に担保済み |
| 実施場所 | `docs/30-workflows/unassigned-task/task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md`。issue-1077 で picker 2 状態は partially consumed、result 2 状態は専用 staging データ投入 + 後始末 teardown を伴う隔離 fixture として残スコープ化。partial-failure は退会済み member + 未登録 tag のデータ投入が前提 |
| 優先度 | low（既存担保ありのため緊急性は低い） |

## baseline（周辺・既存の未タスク候補）

| # | 候補 | 区分 | 備考 |
| --- | --- | --- | --- |
| B-1 | picker baseline の viewport 拡張（mobile / tablet / wide への展開） | improvement | 現状 picker baseline は単一 viewport。レスポンシブ回帰検出を広げる場合の候補。本タスクの desktop 単一 baseline が安定 land した後に検討 |
| B-2 | authenticated staging visual の他 admin 画面（schema / requests / audit 等）への横展開 | improvement | 既存 `staging-visual-authenticated` 基盤の再利用で低コスト。skill-feedback-report.md の再利用パターン候補と連動 |

## 判定

- current: 1 件（C-1）。0 件ではない。
- C-1 は既存未タスク `task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md` に物理 trace 済み。本 wave では同ファイルを `partially_consumed_by_issue_1077` に更新し、残スコープを result 2 状態へ絞った。
- これらは本タスクの land を阻害しない（picker 2 状態の baseline は独立して価値を持つ）。
- B-1 / B-2 は baseline 候補であり、現時点では正式未タスク化しない。C-1 は既存未タスクで管理する。
