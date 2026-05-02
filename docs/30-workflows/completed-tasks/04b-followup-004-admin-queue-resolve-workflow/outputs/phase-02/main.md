# Phase 2 — 設計サマリ

## レイヤ
| レイヤ | 配置 | 役割 |
|--------|------|------|
| Web UI | `apps/web/app/(admin)/admin/requests/page.tsx` + `src/components/admin/RequestQueuePanel.tsx` | server fetch + client interaction |
| Admin proxy | `apps/web/app/api/admin/[...path]/route.ts`（既存） | session→JWT 中継 |
| API route | `apps/api/src/routes/admin/requests.ts` | zod 検証 + D1 batch + audit |
| Repository | `apps/api/src/repository/adminNotes.ts` | `listPendingRequests` 追加。`markResolved`/`markRejected` は既存 |

## API 仕様

### `GET /admin/requests`
- query: `status=pending`（固定、将来拡張のため明示）, `type=visibility_request|delete_request`, `limit=1..100`（既定 20）, `cursor?`
- response: `{ ok, items: [{ noteId, memberId, noteType, requestStatus, requestedAt, requestedReason, requestedPayload(PII除去), memberSummary }], nextCursor, appliedFilters }`
- ordering: `created_at ASC, note_id ASC`（FIFO）
- cursor: `base64url(JSON{createdAt, noteId})` で `(created_at, note_id)` 比較

### `POST /admin/requests/:noteId/resolve`
- body: `{ resolution: "approve"|"reject", resolutionNote?: string(max 500) }`
- 422: visibility approve で `desiredState` が public/member_only/hidden 以外
- 404: noteId 不在
- 409: pending → resolved/rejected の楽観ロック失敗（他 admin が処理済）

## D1 Batch 設計（atomicity）
全 SQL を `c.env.DB.batch([...])` の単一トランザクションで実行する。

**approve + visibility_request:**
```sql
1) UPDATE member_status SET publish_state=?, updated_at=?
   WHERE member_id = (SELECT member_id FROM admin_member_notes
                      WHERE note_id=? AND request_status='pending')
2) UPDATE admin_member_notes SET request_status='resolved', resolved_at=?, resolved_by_admin_id=?, body=...
   WHERE note_id=? AND request_status='pending'
```

**approve + delete_request:**
```sql
1) UPDATE member_status SET is_deleted=1, updated_at=?  -- 同上のサブクエリガード
2) INSERT INTO deleted_members (member_id, reason, deleted_at)
3) UPDATE admin_member_notes ... (同上)
```

**reject:**
```sql
1) UPDATE admin_member_notes SET request_status='rejected', resolved_at=?, ...
   WHERE note_id=? AND request_status='pending'
```

楽観ロック判定: 最終 UPDATE の `meta.changes === 0` → 409 を返す。

## PII 投影
`sanitizePayload(payload)` で `email|phone|name|first_name|last_name|address|birthday|tel|kana` キーを除去して返す。`requestedReason` はユーザ自由入力で扱い、表示時に admin 注意喚起。

## audit
`audit_log` は resolve state update と同じ `DB.batch()` で append する。action は `admin.request.approve` / `admin.request.reject`、`targetType: "member"` に丸め、`after_json.noteId` で request 原典を追跡する。

## error / status
| 条件 | status |
|------|--------|
| 未認証/権限なし | 401 |
| query/body 不正 | 400 |
| visibility 承認で desiredState 不正 | 422 |
| noteId 不在 | 404 |
| 既に resolved/rejected | 409 |
