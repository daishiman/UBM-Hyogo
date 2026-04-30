# Phase 4: テスト戦略

## 実装した Verify Suite

| Suite | File | Coverage |
| --- | --- | --- |
| repository unit | `apps/api/src/repository/attendance.test.ts` | add, duplicate, delete, candidates |
| route contract | `apps/api/src/routes/admin/attendance.test.ts` | 201, 409 existing, 422, 404, DELETE |
| authorization | `apps/api/src/routes/admin/attendance.test.ts` | 401 |
| audit assertion | `apps/api/src/routes/admin/attendance.test.ts` | add/remove audit payload |

## Fixture

`setupD1()` で migration を適用し、`m_alive`, `m_dead`, `s1` を seed。`m_dead` は `member_status.is_deleted=1`。
