# Phase 2 Audit Log Integration

判定: resolved_by_existing_routes

| operation | action | 発火条件 |
| --- | --- | --- |
| add | `attendance.add` | write 成功時のみ |
| remove | `attendance.remove` | delete 成功時のみ |
| duplicate | none | DB 変更なし |
| not_found | none | DB 変更なし |

actor は `requireAdmin` が解決した `authUser.email` を使用する。
