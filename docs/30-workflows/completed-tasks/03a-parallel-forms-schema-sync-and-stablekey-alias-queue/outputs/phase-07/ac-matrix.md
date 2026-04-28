# ac-matrix — 03a forms-schema-sync

| AC | 期待挙動 | 実装ファイル | 検証テスト | 結果 |
| --- | --- | --- | --- | --- |
| AC-1 | 31 項目 / 6 セクションを schema_versions / schema_questions に保存 | forms-schema-sync.ts / flatten.ts / schema-hash.ts | flatten.test.ts / forms-schema-sync.test.ts「31 項目を upsert」 | green |
| AC-2 | unresolved 1 件で schema_diff_queue 1 row | resolve-stable-key.ts / diff-queue-writer.ts / forms-schema-sync.ts | diff-queue-writer.test.ts / forms-schema-sync.test.ts「未知 question は 1 row」 | green |
| AC-3 | alias を D1 既存 stable_key から優先採用 | resolve-stable-key.ts / repository/schemaQuestions.ts#findStableKeyByQuestionId | resolve-stable-key.test.ts「alias 優先」 | green |
| AC-4 | 同 revisionId 再実行で schema_versions 重複 row 無し | forms-schema-sync.ts (INSERT OR REPLACE) | forms-schema-sync.test.ts「同 revisionId 再実行 no-op」 | green |
| AC-5 | sync_jobs が start→succeeded/failed で記録 | forms-schema-sync.ts / repository/syncJobs.ts | forms-schema-sync.test.ts / sync-schema.test.ts | green |
| AC-6 | 同種 schema_sync running なら 409 conflict | forms-schema-sync.ts ConflictError → routes/admin/sync-schema.ts | forms-schema-sync.test.ts / sync-schema.test.ts「409 conflict」 | green |
| AC-7 | sync モジュール内に stableKey 直書き禁止 | resolve-stable-key.ts (UNKNOWN_SENTINEL のみ) / forms-schema-sync.ts (KNOWN_KEY_SET=Set(STABLE_KEY_LIST)) | grep 静的検証（ESLint custom rule は wave 8b 化） | green |
| AC-8 | known 31 項目で stable_key='unknown' は 0 件 | forms-schema-sync.ts | forms-schema-sync.test.ts「unknown=0」 | green |

---

## ファイル一覧（再掲）

```
apps/api/src/sync/schema/
├── index.ts
├── types.ts
├── flatten.ts
├── schema-hash.ts
├── resolve-stable-key.ts
├── diff-queue-writer.ts
└── forms-schema-sync.ts

apps/api/src/routes/admin/sync-schema.ts
apps/api/src/middleware/admin-gate.ts
apps/api/tests/fixtures/forms-get.ts
```
