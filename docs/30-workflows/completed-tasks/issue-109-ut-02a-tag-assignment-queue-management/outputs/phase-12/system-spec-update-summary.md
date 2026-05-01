# System Spec Update Summary

## 更新済み spec ファイル（same-wave sync）

| spec | 章 | 反映内容 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/08-free-database.md` | tag_assignment_queue | `idempotency_key` / `attempt_count` / `last_error` / `next_visible_at` / `dlq_at` の 5 列、partial unique index、pending/dlq 補助 index、`dlq` status を反映 |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | tag assignment queue | admin queue / DLQ filter / response 単位 idempotency / follow-up 境界を反映 |
| `docs/00-getting-started-manual/specs/12-search-tags.md` | tag assignment resolve API | `dlq` status、UT-02A write-side workflow、`<memberId>:<responseId>` idempotency key を反映 |

> Phase 12 same-wave sync として上記 3 ファイルへ反映済み。commit / PR 作成のみ Phase 13 のユーザー承認待ち。

## stale contract withdrawal

- 02a Phase 12 `unassigned-task-detection.md` の本タスク参照は、本ワークフローと formal stub により formalize 済み
- 旧記載「memberTags 直接書き込み案」は不採用（不変条件 #13）として stale 化済

## integration matrix 更新

- 上流: 03b sync hook (candidate 投入元), 02a memberTags.ts (read-only 制約源), 02b 既存 schema
- 下流: 07a tagQueueResolve workflow（transitionStatus / dlq 拡張を消費）, 08a contract test
