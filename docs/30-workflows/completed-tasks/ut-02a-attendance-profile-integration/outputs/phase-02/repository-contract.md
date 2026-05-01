# Repository Contract

## Interface

```ts
export interface AttendanceProvider {
  findByMemberIds(
    ids: ReadonlyArray<MemberId>,
  ): Promise<ReadonlyMap<MemberId, ReadonlyArray<AttendanceRecord>>>;
}
```

## Rules

- Empty input returns an empty `Map` and performs no D1 query.
- Missing member entry means attendance count is zero.
- Query uses `WHERE member_id IN (...)` with chunking.
- Deleted meeting sessions are excluded.
- Sort order is `held_on DESC`, then `session_id ASC`.
