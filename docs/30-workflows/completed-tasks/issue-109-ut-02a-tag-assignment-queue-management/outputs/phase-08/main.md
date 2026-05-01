# Phase 8: DRY 化 / リファクタ — 成果物

詳細: refactor-targets.md

## 採用方針: 最小限の DRY 化（YAGNI）

本タスクは既存 `apps/api/src/repository/tagQueue.ts` の拡張であり、02b/03a と共有可能な helper を `apps/api/src/lib/queue/` に切り出すべきかを検討した結果、**現時点では切り出さない** 判断を採用。

理由:

- 02b の `schemaDiffQueue` は別 schema（`schema_diff_queue`）であり、retry/DLQ 列も非対称
- 03a の `stable_key_alias_queue` は別領域（forms schema 同期）
- 単一所有原則に基づき、本タスクは tag_assignment_queue のみを所有する

仕様語 ↔ DB 語の変換は `TagQueueStatus` enum + ALLOWED_TRANSITIONS で十分単一化されており、
別途 `aliasMap.ts` を導入する必要はない。

## Before / After（本タスク内のリファクタ）

| 区分 | Before | After | 理由 |
| --- | --- | --- | --- |
| 状態遷移管理 | 既存 `transitionStatus` のみ | `incrementRetry` / `moveToDlq` を guarded UPDATE で追加 | retry/DLQ も一貫して fail-closed |
| idempotency | 未対応 | `createIdempotent` + `idempotency_key` UNIQUE 列 | 重複防止 |
| TagQueueStatus | `queued / reviewing / resolved / rejected` | + `dlq` | retry 終端 |

## IPC 契約ドリフト確認

| 観点 | 検証 | 結果 |
| --- | --- | --- |
| apps/web から D1 直接参照なし | `grep -RIn "DB_BINDING\|d1.prepare" apps/web/src` | 0 件（Phase 9 quality-report で実測） |
| apps/web から tagQueue repository 直接 import なし | `grep -RIn "from .*repository/tagQueue" apps/web/src` | 0 件 |
| 02a memberTags.ts に新規 write 経路なし | `grep -RIn "INSERT INTO member_tags" apps/api/src` | 既存 `assignTagsToMember`（07a 経由）の 1 件のみ |
| queue 状態遷移の単一窓口 | repository function 経由 | 達成 |
