# 未タスク検出

## 検出結果

本タスクの実装中に発見された **新規未タスク候補** は以下のとおり。

| # | 候補 | 緊急度 | 提案 |
| --- | --- | --- | --- |
| 1 | 07a / 07c 側で `markResolved` / `markRejected` を実際に呼び出し audit_log にも `member.self_request.resolved` / `rejected` を append する route 実装 | 中 | 既存の `04b-followup-004-admin-queue-resolve-workflow.md` で対応 |
| 2 | rate-limit-self-request の bucket 単位を session 単位 → member 単位への切替検討（再申請が頻繁になる可能性） | 低 | 運用上問題が発生してから対応 |

`08-free-database.md` の物理 schema drift は本レビューで解消済み。残件はいずれも
本タスクの helper 提供を越える route / 運用ポリシーであり、影響範囲が独立している。
