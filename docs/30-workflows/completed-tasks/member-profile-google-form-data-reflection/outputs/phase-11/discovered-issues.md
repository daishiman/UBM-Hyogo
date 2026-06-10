# Phase 11 発見事項（スコープ外）

## メタ情報
- TASK_ID: `TASK-MEMBER-FORM-DATA-REFLECTION-001`
- 状態: `pending_implementation`（spec_created。実機検証は user-gated）

## 発見事項（current / baseline 分離）

| ID | 分類 | 内容 | 扱い |
|----|------|------|------|
| DISC-B-01 | baseline | 旧 `__extra__:<questionId>` 行（unmapped 時代の残存）が response_fields に残る。表示 API は known stableKey のみ参照するため表示には無害 | TECH-M-02 として Phase 12 未タスク検出で current/baseline 分離記録。クリーンアップは別タスク候補 |
| DISC-B-02 | baseline | schema sync が staging で未実行/失敗していた運用要因の恒久監視（SYNC_ALERTS の qid_map_empty alert で今後検知可能） | Lane B で可視化済み。アラート閾値の運用調整は将来 |

> current（本サイクルで修正すべき gap）は 0 件。上記は baseline（既存事象・本タスクのスコープ外）。
