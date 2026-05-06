# Phase 2 Admin Route Design

判定: resolved_by_existing_routes

| route | status |
| --- | --- |
| `POST /admin/meetings/:sessionId/attendances` | canonical 06c-E route |
| `POST /admin/meetings/:sessionId/attendance` | legacy 07c compatibility route |
| `DELETE /admin/meetings/:sessionId/attendance/:memberId` | legacy remove route |

全 route は `requireAdmin` 経由。apps/web から D1 へ直接 write しない。
