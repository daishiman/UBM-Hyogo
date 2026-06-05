# Phase 12 / Task 12-4: 未タスク検出レポート

`[実装区分: 実装完了]` / `workflow_state: implemented_local_evidence_captured`

## 検出ソース一覧

| ソース | 確認内容 | 結果 |
| --- | --- | --- |
| 元タスク仕様書「スコープ外」 | email 補助表示 / API contract 拡張 / staging visual baseline | email/API は不要判断。local screenshot は保存済み。staging visual は optional user-gated boundary |
| Phase 3 レビュー MINOR | 設計レビューの MINOR 指摘 | fallback 仕様と PII 最小化で解決 |
| Phase 11 手動テスト発見 | スコープ外の発見・改善提案 | 新規なし |
| コードコメント | 対象 3 ファイルの新規 TODO/FIXME/HACK/XXX | 新規なし |
| `describe.skip` | 新規 skip | 新規なし |

## current（本タスク由来）— 個別評価

### 候補-1: member の email 補助表示

| 項目 | 内容 |
| --- | --- |
| 扱い | **本タスクでは不要判断（未タスク化しない）** |
| 理由 | AC-1 は `fullName` で充足し、email 表示は PII 表示拡大になる。需要未確認のため新規起票しない |

### 候補-2: staging 認証付き visual baseline 取得

| 項目 | 内容 |
| --- | --- |
| 扱い | **新規未タスク化しない / optional user-gated boundary** |
| 理由 | 本タスクは local component evidence と local screenshot を主証跡として完了済み。親 #1036 系 followup-001=#1077 が `/admin/members` の認証付き staging visual baseline 基盤を別管理しているため、staging baseline は optional user-gated reinforcement として分離する |

## baseline（既存）— 関連 followup / Issue の差分確認

| 既存タスク / Issue | 重複の有無 | 判定 |
| --- | --- | --- |
| `#1077` | 重複なし・独立 | staging visual 基盤。新規起票しない |
| `#1078` | 重複なし・独立 | tag picker UX。result summary 非接触 |
| `#1079` | 重複なし・独立 | audit viewer / API 側。別関心 |
| `#1036` | 重複なし | bulk 機能本体。今回 result 表示を上乗せ |
| `task-issue-1036-followup-004-bulk-tag-result-member-labels` | 本 workflow へ formalize 済み | source unassigned を `formalized_as_issue_1080_implemented_local` へ同期 |

## 結論

本サイクルで formalize する新規未タスク: **0 件**。
