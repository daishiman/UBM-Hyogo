# Phase 2: 設計 — main

## モジュール構造
```mermaid
graph TB
  subgraph apps_api[apps/api/src/repository]
    shared[_shared/db.ts<br/>_shared/brand.ts]
    meetings[meetings.ts]
    attendance[attendance.ts]
    tagDef[tagDefinitions.ts]
    tagQueue[tagQueue.ts]
    schemaVer[schemaVersions.ts]
    schemaQ[schemaQuestions.ts]
    schemaDiff[schemaDiffQueue.ts]
  end
  D1[(Cloudflare D1)]
  shared --> D1
  meetings --> shared
  attendance --> shared
  tagDef --> shared
  tagQueue --> shared
  schemaVer --> shared
  schemaQ --> shared
  schemaDiff --> shared
  attendance -. read-only .-> status02a[02a status.ts]
```

## tag_assignment_queue 状態遷移
```mermaid
stateDiagram-v2
  [*] --> queued: enqueue (03b)
  queued --> reviewing: transitionStatus (07a)
  reviewing --> resolved: transitionStatus (07a)
  resolved --> [*]
```
逆方向遷移は `RangeError` を throw（unidirectional）。

## schema_diff_queue 状態遷移
```mermaid
stateDiagram-v2
  [*] --> queued: enqueue (03a)
  queued --> resolved: resolve (07b)
  added --> [*]: resolve (07b)
  changed --> [*]: resolve (07b)
  removed --> [*]: resolve (07b)
```

## D1 query 戦略（無料枠）
| 場面 | クエリ | index |
| --- | --- | --- |
| listMeetings | `ORDER BY held_on DESC LIMIT ? OFFSET ?` | PK |
| listAttendanceBySession | `WHERE session_id = ?` | idx_member_attendance_session |
| listQueue(status) | `WHERE status = ? ORDER BY created_at` | idx_tag_assignment_queue_status |
| getLatestVersion | `WHERE form_id = ? AND state='active' ORDER BY synced_at DESC LIMIT 1` | (form_id,state,synced_at) |
| schemaDiff.list | `WHERE status='queued' ORDER BY created_at` | idx_schema_diff_status |
| listAttendableMembers | `JOIN member_status ms WHERE ms.is_deleted = 0 AND mid NOT IN (SELECT member_id FROM member_attendance WHERE session_id=?)` | idx_member_status_public |
