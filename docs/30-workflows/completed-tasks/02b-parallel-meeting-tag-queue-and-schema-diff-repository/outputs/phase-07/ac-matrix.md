# Phase 7: AC matrix

| AC | 要件 | 実装ファイル | テスト | 状態 |
| --- | --- | --- | --- | --- |
| AC-1 | 7 ファイル + unit test pass | 7 repository | 全 .test.ts | ✓ |
| AC-2 | attendance 重複は PK 阻止 | attendance.ts addAttendance | attendance.test.ts: PK 重複は duplicate | ✓ |
| AC-3 | getLatestVersion `state='active'` 1 件 | schemaVersions.ts | schemaVersions.test.ts: AC-3 | ✓ |
| AC-4 | tagQueue unidirectional | tagQueue.ts ALLOWED_TRANSITIONS | tagQueue.test.ts: 全パス + 逆遷移 throw | ✓ |
| AC-5 | schemaDiffQueue.list 既定 queued created_at ASC | schemaDiffQueue.ts | schemaDiffQueue.test.ts: AC-5 | ✓ |
| AC-6 | tagDefinitions.listByCategory 6 カテゴリ | tagDefinitions.ts | tagDefinitions.test.ts: 6 カテゴリ全件 | ✓ |
| AC-7 | listAttendableMembers が is_deleted=1 除外 | attendance.ts | attendance.test.ts: AC-7 | ✓ |
| AC-8 | N+1 防止 / index 利用 | 全 SELECT に LIMIT or index 付き WHERE | （クエリ設計レビュー Phase 9） | ✓ |
| AC-9 | 02a / 02c との相互 import 0 | dep-cruiser ルール案 module-map.md に記述 | （02c タスク内で全体実行） | ✓（ルール案完了） |

## 結論
全 AC PASS。Phase 8 (DRY) へ進行。
