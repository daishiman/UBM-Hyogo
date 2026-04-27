# Phase 9: free-tier

## D1 無料枠（5GB / 500k reads/day）に対する設計
| クエリ | 発行頻度想定 | index | reads/req |
| --- | --- | --- | --- |
| listMeetings | admin 数件/日 | PK | 1 |
| listAttendanceBySession | session ページ閲覧/admin | idx_member_attendance_session | 1 |
| listQueue(status) | admin 数件/日 | idx_tag_assignment_queue_status | 1 |
| getLatestVersion | API 起動 / sync ごと | (form_id, state) | 1 |
| schemaDiff.list | admin 数件/日 | idx_schema_diff_status | 1 |
| listAttendableMembers | admin 数件/日 | idx_member_status_public + idx_member_attendance_session | 1（NOT IN サブクエリ 1 + JOIN 1） |

合計想定: 1 日 < 1k reads。500k に対し十分余裕。
