# Phase 2: module-map

## 公開 interface（要約）

### meetings.ts
- `findMeetingById(c, id) → MeetingSessionRow | null`
- `listMeetings(c, limit, offset) → MeetingSessionRow[]`
- `listRecentMeetings(c, n) → MeetingSessionRow[]`
- `insertMeeting(c, row) → MeetingSessionRow`

### attendance.ts
- `listAttendanceByMember(c, mid)`
- `listAttendanceBySession(c, sid)`
- `addAttendance(c, mid, sid, by) → { ok:true } | { ok:false; reason }`
- `removeAttendance(c, mid, sid)`
- `listAttendableMembers(c, sid) → Array<{memberId, fullName, occupation}>`

### tagDefinitions.ts
- `listAllTagDefinitions(c)`
- `listByCategory(c, category)`
- `findByCode(c, code)`
- write API 不在（不変条件 #13）

### tagQueue.ts
- `listQueue(c, status?)`
- `findQueueById(c, qid)`
- `enqueue(c, row)`
- `transitionStatus(c, qid, next)` — 不正遷移は throw

### schemaVersions.ts
- `getLatestVersion(c, formId)` — `state='active'` 1 件
- `listVersions(c, formId)`
- `upsertManifest(c, row)`
- `supersede(c, formId, oldRevisionId)`

### schemaQuestions.ts
- `listFieldsByVersion(c, formId, revisionId)`
- `findFieldByStableKey(c, stableKey)`
- `upsertField(c, row)`
- `updateStableKey(c, questionId, newKey)`

### schemaDiffQueue.ts
- `list(c, type?)` — 既定で `status='queued'` を `created_at ASC`
- `findById(c, did)`
- `enqueue(c, row)`
- `resolve(c, did, by)`

## dep-cruiser ルール案
```js
forbidden: [
  { name: '02b-no-import-02a-internal',
    from: { path: '^apps/api/src/repository/(meetings|attendance|tagDefinitions|tagQueue|schemaVersions|schemaQuestions|schemaDiffQueue)\\.ts$' },
    to:   { path: '^apps/api/src/repository/(members|identities|status|responses|tags)\\.ts$',
            pathNot: '^apps/api/src/repository/_shared/' } },
  { name: '02b-no-import-02c',
    from: { path: '^apps/api/src/repository/(meetings|attendance|tagDefinitions|tagQueue|schemaVersions|schemaQuestions|schemaDiffQueue)\\.ts$' },
    to:   { path: '^apps/api/src/repository/(adminUsers|adminMemberNotes|auditLog|syncJobs|magicTokens)\\.ts$' } },
]
```
注: `attendance.ts` のみ `_shared/status-readonly.ts`（02a 提供想定）経由で is_deleted を参照。
