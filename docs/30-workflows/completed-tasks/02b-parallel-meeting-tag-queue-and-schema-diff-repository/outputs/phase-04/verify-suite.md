# Phase 4: verify-suite

## テストファイル
| File | カバレッジ | AC |
| --- | --- | --- |
| meetings.test.ts | findMeetingById / listMeetings / listRecent / insertMeeting | AC-1, AC-8 |
| attendance.test.ts | listBy*, addAttendance(成功/重複/削除済み)、listAttendableMembers | AC-1, AC-2, AC-7 |
| tagDefinitions.test.ts | listAll / listByCategory / findByCode | AC-1, AC-6 |
| tagQueue.test.ts | transitionStatus 全パス + 不正遷移 throw | AC-1, AC-4 |
| schemaVersions.test.ts | getLatestVersion / supersede | AC-1, AC-3 |
| schemaQuestions.test.ts | listFieldsByVersion / updateStableKey | AC-1 |
| schemaDiffQueue.test.ts | list 既定 queued / resolve not-found | AC-1, AC-5 |

## fake D1
`_shared/__fakes__/fakeD1.ts` に最小実装。
- `prepare(sql).bind(...).first()/.all()/.run()` をサポート
- in-memory Map<table, row[]> + JSON-eval なルックアップ
- PK 重複 insert は `Error("D1_ERROR: UNIQUE constraint failed")` を throw

## 不変条件マッピング
| 不変条件 | テスト |
| --- | --- |
| #15 重複阻止 | attendance.test.ts: PK violation → reason="duplicate" |
| #15 削除済み除外 | attendance.test.ts: listAttendableMembers excludes is_deleted=1 |
| #13 tag 直接編集禁止 | tagDefinitions.test.ts: 型レベルで write API 不在 |
| #14 schema 集約 | schemaDiffQueue/schemaVersions/schemaQuestions の write が repository 経由のみ |
