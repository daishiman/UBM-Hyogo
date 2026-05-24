# 未タスク検出レポート — issue-837-schema-alias-bulk-rollback

Phase 12 Task 4。0 件でも出力必須。本タスクで明示的にスコープ外とした項目を未タスク候補として棚卸しし、formalize（新規 unassigned-task 化）の要否を判定する。

## 検出ソースと確認結果

| ソース | 確認結果 |
| --- | --- |
| 元タスク仕様書（index.md「含まないもの」） | 3 項目をスコープ外として明示（下表 C-1〜C-3） |
| Phase 3 / Phase 10 レビュー（MINOR 判定） | R-8（`runWithConcurrency` SSOT）= Phase 8 で同一 wave 解消済（下記参照） |
| Phase 11 手動テスト | local typecheck / focused Vitest は実施済み。runtime screenshot / staging smoke は user-gated boundary として残し、スコープ外の新規未タスク候補なし |
| コードコメント（TODO/FIXME/HACK/XXX） | 本タスクは未実装のため対象コードなし |
| `describe.skip` ブロック | 該当なし（未実装） |

## 未タスク候補一覧

| ID | 候補 | formalize 要否 | 理由 |
| --- | --- | --- | --- |
| C-1 | batch parent-child audit log 構造 | **不要（未起票でよい）** | API route 追加 + D1 schema migration を要し、本タスク不変条件「API/D1 変更なし」と別関心。per-alias `schema_alias.rollback` 記録で AC-3（各 alias の rollback 結果追跡）を充足するため機能 gap は生じない。将来 audit 可視化の必要が出た時点で別 Issue 化する |
| C-2 | recompute trigger（集計再実行） | **不要（既に分離済み）** | `serial-05-step-03-followup-005-schema-alias-recompute-trigger.md` として独立 unassigned-task 化済み。本タスクで重複起票しない |
| C-3 | rollback notification | **不要（既に分離済み）** | `serial-05-step-03-followup-007-schema-alias-rollback-notification.md` として独立 unassigned-task 化済み。本タスクで重複起票しない |

## Phase 3 MINOR（R-8）の扱い

- **R-8**: `runWithConcurrency` を bulk resolve / bulk rollback で重複定義しないための SSOT 化。
- **判定: 未タスク化不要**。Phase 8（リファクタリング）で **同一 wave 内に解消する設計** として確定済み（既存 private util を再利用 / 重複定義禁止）。Phase 9 gate に `grep -rn "function runWithConcurrency\|const runWithConcurrency" apps/web/src/` → 1 件のみ確認を組み込み済み。本タスク内で閉じるため backlog 送りにしない（CONST_007）。

## 関連タスク差分確認（重複起票防止 / FB-CANCEL-004-2）

| 既存タスク ID | 重複の有無 | 統合先 |
| --- | --- | --- |
| `serial-05-step-03-followup-005-...-recompute-trigger` | C-2 と同一。重複起票しない | 既存 unassigned-task に統合済み |
| `serial-05-step-03-followup-007-...-rollback-notification` | C-3 と同一。重複起票しない | 既存 unassigned-task に統合済み |
| Issue #778 / #776 | 実装完了済み。本タスクと重複なし | completed-tasks |

## 新規 formalize 件数

**新規 formalize: 0 件。**

スコープ外 3 項目はいずれも (a) 既存 unassigned-task として分離済み（C-2/C-3）、または (b) per-alias audit で AC 充足し機能 gap が生じない（C-1）ため、本タスクからの新規未タスク化は不要と判定する。
