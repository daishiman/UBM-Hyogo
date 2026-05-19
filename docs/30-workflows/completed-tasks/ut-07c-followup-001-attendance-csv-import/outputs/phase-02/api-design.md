# Phase 2 — API 設計

## endpoint 表

| 項目 | 値 |
| --- | --- |
| method | POST |
| path (公開) | `/admin/meetings/:sessionId/attendance/import` |
| path (route-local) | `/meetings/:sessionId/attendance/import` |
| query | `dryRun=true|false`（既定 `false`） |
| content-type | `application/json` |
| middleware | `requireAdmin` + `writeTagNoteProviderMiddleware`（既存 attendance route で適用済） |
| 将来拡張 | `multipart/form-data` によるサーバ側 parse（MVP では未対応） |

## zod schema

```ts
const attendanceImportRowSchema = z
  .object({
    memberId: z.string().min(1).optional(),
    email: z.string().min(1).optional(),
  })
  .refine((r) => Boolean(r.memberId) || Boolean(r.email), {
    message: "either memberId or email is required",
  });

const attendanceImportRequestSchema = z.object({
  rows: z.array(attendanceImportRowSchema).min(0),
});
```

- `rows.length > 500` は zod 通常 400 ではなく **route handler で先行分岐** して 413 (`payload_too_large`) を返す
- zod parse 失敗は 400 (`invalid_payload`)
- JSON parse 失敗は 400 (`invalid_json`)

## レスポンス shape (200)

```json
{
  "summary": {
    "total": 12,
    "ok": 10,
    "duplicate": 1,
    "deletedMember": 0,
    "unknownMember": 1,
    "invalid": 0
  },
  "rows": [
    { "index": 0, "status": "ok", "memberId": "mem_xxx" },
    { "index": 1, "status": "duplicate", "memberId": "mem_yyy" },
    { "index": 2, "status": "unknown_member", "message": "email not found" }
  ],
  "dryRun": true,
  "committed": false
}
```

## エラーレスポンス

| HTTP | error code | 条件 |
| --- | --- | --- |
| 400 | `invalid_json` | JSON parse 失敗 |
| 400 | `invalid_payload` | zod parse 失敗 |
| 401 | (requireAdmin) | 未認証 |
| 403 | (requireAdmin) | non-admin |
| 404 | `session_not_found` | meeting_sessions に sessionId が存在しない |
| 413 | `payload_too_large` | rows.length > 500 |

## 副作用 contract

| dryRun | DB 副作用 | audit_log |
| --- | --- | --- |
| `true` | なし (write API 呼び出し 0 件) | 0 record |
| `false` かつ全行 preflight ok | `member_attendance` insert (chunk size 80) | 成功行数と同件数 |
| `false` かつ 1 行でも非 ok | insert 0 / response の status は preview と同じ shape を返し `committed=false` | 0 record |

> 「commit 経路は全行 preflight ok の場合のみ insert」と定義することで、partial commit 起因の audit_log drift を構造的に排除する。
