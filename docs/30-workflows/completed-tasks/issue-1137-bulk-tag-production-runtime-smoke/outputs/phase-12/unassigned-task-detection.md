# Unassigned Task Detection — issue-1137-bulk-tag-production-runtime-smoke

## 検出ソース（4 パターン）

| ソース | 確認 | 結果 |
| ------ | ---- | ---- |
| 元タスク仕様書「スコープ外」 | staging 変更 / endpoint 変更 / 共通 lib 抽出 / server idempotency store | 明示分離済み（下記 baseline） |
| Phase 3/10 レビュー MINOR | M-1〜M-3 | baseline 記録（起票せず） |
| Phase 11 手動テスト発見事項 | production 実走は未実施（implemented_local_runtime_pending） | current gap なし |
| コードコメント TODO/FIXME | 本タスクは新規 spec のみ・runner・SQL・CI・test 差分あり | 該当なし |

## current（今回サイクルで対応すべき未タスク）

**0 件。** 本仕様書のスコープ（runner 拡張 / production seed・cleanup SQL / CI job / local test 拡張 / runbook）は本サイクルで実装・同期済み。production real D1 実走のみ user 二重承認後に残るが、これは副作用境界であり未タスク化ではない。

## baseline（将来候補・本 wave では起票しない）

| ID | 内容 | 非起票理由 |
| -- | ---- | ---------- |
| B-1 | smoke runner 共通 lib 抽出（followup-007） | 既存の別 unassigned task（`task-issue-1036-followup-007-smoke-runner-common-lib-extraction.md`）。本タスクは共通 lib に依存せず単一 runner env 分岐で完結。重複起票回避 |
| B-2 | production smoke の定期実行スケジュール化 | YAGNI。production mutation を定期自動実行する需要は現状なし。workflow_dispatch 手動 + 二重承認が安全方針 |
| B-3 | production fixture を複数 member/tag へ拡張 | 現状 2 member × 2 tag（EXPECTED_ITEMS=4）で assign/noop/unassign/audit parity を十分検証可能。拡張は将来の必要時 |

## 関連タスク差分確認（重複起票防止）

- followup-007（共通 lib 抽出）= 既存 unassigned。B-1 は新規起票せず既存へ委譲。
- issue #913（server idempotency store）= 別物。本タスクの冪等性検証とは無関係。
- 消費元 followup-006 unassigned-task = 本仕様書で formalize（consumed）。

## 結論

current 未タスク 0 件（先送りなし）。baseline 3 件は将来候補として記録のみ。
