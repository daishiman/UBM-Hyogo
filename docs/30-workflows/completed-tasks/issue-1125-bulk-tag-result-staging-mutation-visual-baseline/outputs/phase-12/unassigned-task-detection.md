# Unassigned Task Detection

current（本タスク派生の新規 gap）と baseline（既存・代替担保済みの scope-out / 周辺候補）を分離して記録する。

## current（今サイクルで新規発生した gap）

| # | 未タスク | 区分 | 検出結果 |
| --- | --- | --- | --- |
| — | （なし） | — | 本サイクルで新規に発生した未タスクは **0 件**。result 2 状態（all-success / partial-failure）の baseline は本タスク自身の主スコープ（in-scope）であり、`notFound` 視覚網羅は既存の代替担保がある scope-out（baseline 参照）であって current gap ではない |

> 本タスクは `task-issue-1036-followup-001` の残スコープ（result 2 状態の認証付き staging mutation baseline）を **消化する側**であり、issue-1077 が current に記録した「C-1: result 2 状態の staging mutation baseline 取得」を本タスクが引き受ける。よって本サイクルから新たに派生する未タスクは無い。

## baseline（既存・代替担保済みの scope-out / 周辺候補）

| # | 候補 | 区分 | 検出理由 / 代替担保 |
| --- | --- | --- | --- |
| B-1 | `notFound`（未登録 tag）の **staging runtime visual baseline** | scope-out（代替担保済み） | tag picker は `tag_definitions.active=1` の登録済み tag しか描画しない設計上、UI 操作で `notFound` を自然発生させられない（UI 再現不可）。代替担保: 親 local fixture `bulk-tag-result-partial-failure.png`（`page.setContent()` で `notFound` を含む状態を描画済み・`issue1036-bulk-member-tags.spec.ts`）+ component spec `BulkActionBar.spec.tsx` TC-BAB-TAG-03（counts / skipped / notFound 描画を unit で担保）が継続担保する。**current gap ではなく、既存の代替担保が存在する scope-out**（未取得のまま残す「先送り」ではない） |
| B-2 | result baseline の viewport 拡張（mobile / tablet / wide への展開） | improvement | 現状 result baseline は desktop 単一 viewport。レスポンシブ回帰検出を広げる場合の候補。本タスクの desktop 単一 baseline が安定 land した後に検討 |
| B-3 | authenticated staging mutation visual の他 admin 操作（schema 編集 / requests 承認 / identity 解決等）への横展開 | improvement | 既存 `staging-visual-authenticated` project + seed/cleanup runner 基盤の再利用で低コスト。skill-feedback-report.md の再利用パターン候補と連動 |

### B-1 詳細（`notFound` scope-out の根拠）

| 項目 | 内容 |
| --- | --- |
| 内容 | `bulk-tag-result-not-found`（未登録 tagId の `notFound`）を含む result summary の staging runtime visual baseline |
| scope-out にした理由 | tag picker が登録済み tag のみ描画するため UI 操作で自然発生不可。staging で `notFound` を強制発生させるには登録済み tag を mutation 直前に削除する等の脆い操作が必要で、共有 staging データの安定性を損なう |
| 機能担保の現状 | 親 local fixture（`page.setContent()`）+ `BulkActionBar.spec.tsx` TC-BAB-TAG-03 で result summary の `notFound` 描画は既に担保済み |
| 本タスクの partial-failure 主シナリオ | 退会済み member（`member_status.is_deleted=1`）による `skipped`（実 mutation + UI 操作で確実に再現可能・Phase 1 §1.2 / Phase 2 §2.2） |
| 優先度 | low（既存担保ありのため緊急性は低い） |

## 関連タスク差分確認（既存 unassigned-task との重複チェック）

| 既存 unassigned-task | 重複判定 | 処置 |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md`（残スコープ追跡 Issue #1125） | **本タスクが消費する** | issue-1077 で picker 2 状態は `partially_consumed_by_issue_1077`。残スコープ（result 2 状態の認証付き staging mutation baseline）を本タスク（issue-1125）が消化する。同ファイルに consumed pointer（result 2 状態 → 本 workflow `issue-1125-bulk-tag-result-staging-mutation-visual-baseline`）を反映する。新規 unassigned-task は起票しない |

## 判定

- current: **0 件**（新規派生 gap なし）。
- 本タスクは既存未タスク `task-issue-1036-followup-001-...` の残スコープを消化する側であり、result 2 状態は in-scope。
- B-1（`notFound` 視覚網羅）は **代替担保済みの scope-out** であり current gap ではない。先送りでもなく、親 local fixture + component spec で担保される。
- B-2 / B-3 は baseline 候補であり、現時点では正式未タスク化しない。
- いずれも本タスクの land を阻害しない。
