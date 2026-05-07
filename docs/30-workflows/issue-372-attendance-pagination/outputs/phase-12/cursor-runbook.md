# Cursor Runbook

## Format

```ts
type AttendanceCursor = {
  heldOn: string;    // YYYY-MM-DD
  sessionId: MeetingSessionId;
};
```

External cursor は `base64url(JSON.stringify(cursor))`。client は opaque string として保存し、分解しない。

## SQL

```sql
WHERE member_id = ?
  AND (held_on < ? OR (held_on = ? AND session_id < ?))
ORDER BY held_on DESC, session_id DESC
LIMIT ?
```

取得件数は `limit + 1`。余分な 1 件がある場合は `hasMore=true` とし、返却 records は `limit` 件に切る。

## Errors

| Case | Behavior |
| --- | --- |
| malformed cursor | route returns 400 |
| decoded JSON missing `heldOn` or `sessionId` | route returns 400 |
| `limit < 1` | route returns 400 |
| `limit > 200` | silently clamp to 200 |

## Client

- 初回は `/me/profile` or `/admin/members/:memberId` の `attendance` と `attendanceMeta` を描画する。
- `attendanceMeta.hasMore` が true のときだけ load-more button を表示する。
- 追加取得後は records を末尾 append し、`nextCursor` を更新する。
