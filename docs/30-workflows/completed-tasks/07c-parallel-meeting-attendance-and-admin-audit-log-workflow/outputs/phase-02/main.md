# Phase 2: 設計

## Endpoint

| Method | Path | 成功 | 主要異常 |
| --- | --- | --- | --- |
| GET | `/admin/meetings/:sessionId/attendance/candidates` | `200 { ok, items }` | 401/403 |
| POST | `/admin/meetings/:sessionId/attendance` | `201 { ok, attendance }` | 400/404/409/422 |
| DELETE | `/admin/meetings/:sessionId/attendance/:memberId` | `200 { ok, attendance }` | 401/403/404 |

## Module

| ファイル | 責務 |
| --- | --- |
| `apps/api/src/routes/admin/attendance.ts` | Hono route、auth、status code、audit append |
| `apps/api/src/repository/attendance.ts` | D1 CRUD、duplicate 検出、candidates resolver |
| `apps/api/src/repository/auditLog.ts` | append-only audit log |
| `apps/api/src/routes/admin/attendance.test.ts` | API contract と audit assertion |
| `apps/api/src/repository/attendance.test.ts` | repository unit test |

## Design Decision

既存コードは明示的 `auditAppend` パターンを採用しているため、今回の実装では新規 middleware を増やさず attendance route 内で既存パターンに合わせる。action 名は 07c 仕様どおり `attendance.add` / `attendance.remove`。

## Env

新規 env / secret はなし。D1 binding `DB` と `AUTH_SECRET` は既存 admin gate を利用する。
