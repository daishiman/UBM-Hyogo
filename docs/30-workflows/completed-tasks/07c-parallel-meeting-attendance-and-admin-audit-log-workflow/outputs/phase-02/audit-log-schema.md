# audit_log Schema

既存 migration `apps/api/migrations/0003_auth_support.sql` を正とする。

| Column | Meaning | 07c usage |
| --- | --- | --- |
| `audit_id` | row id | `crypto.randomUUID()` |
| `actor_id` | admin actor id | `authUser.memberId` |
| `actor_email` | admin email | `authUser.email` |
| `action` | operation | `attendance.add` / `attendance.remove` |
| `target_type` | target domain | `meeting` |
| `target_id` | session id | `sessionId` |
| `before_json` | before payload | DELETE removed row |
| `after_json` | after payload | POST inserted row |
| `created_at` | timestamp | repository default |

Append-only 方針を維持し、UPDATE/DELETE repository API は追加しない。
