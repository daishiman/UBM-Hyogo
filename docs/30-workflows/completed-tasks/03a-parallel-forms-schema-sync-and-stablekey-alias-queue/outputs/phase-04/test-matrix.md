# test matrix — 03a forms-schema-sync

AC × test 種別 × fixture × 実装ファイル の対応表。

| AC | unit | contract | authz | E2E (8b) | fixture | 実装テストファイル |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 31 項目・6 セクション保存 | flatten / runSchemaSync | schema_versions / schema_questions row | - | 同期後一覧 | FORMS_GET_31_ITEMS | flatten.test.ts / forms-schema-sync.test.ts |
| AC-2 unresolved を queue 追加 | resolveStableKey + diffQueueWriter | schema_diff_queue row | - | 新規 question 追加 | FORMS_GET_WITH_UNKNOWN | resolve-stable-key.test.ts / diff-queue-writer.test.ts / forms-schema-sync.test.ts |
| AC-3 alias 解決後 stableKey 更新 | resolveStableKey alias 引き | schema_questions stable_key | - | 07b workflow 経由 | aliases fixture（D1 prefill） | resolve-stable-key.test.ts |
| AC-4 同 revisionId 再実行 no-op | runSchemaSync | schema_versions COUNT 不変 | - | - | FORMS_GET_31_ITEMS | forms-schema-sync.test.ts |
| AC-5 sync_jobs 遷移記録 | runSchemaSync | sync_jobs row（status） | - | - | - | forms-schema-sync.test.ts / sync-schema.test.ts |
| AC-6 同種 job 排他 | runSchemaSync ConflictError | POST 409 response | admin + running | - | - | forms-schema-sync.test.ts / sync-schema.test.ts |
| AC-7 stableKey 直書き禁止 | - | - | - | - | grep 静的検証 | （CI lint rule）|
| AC-8 31 項目欠落なし | runSchemaSync | schema_questions COUNT(stable_key='unknown')=0 | - | - | FORMS_GET_31_ITEMS | forms-schema-sync.test.ts |

## fixture 配置

```
apps/api/tests/fixtures/
└── forms-get.ts            # FORMS_GET_31_ITEMS / FORMS_GET_WITH_UNKNOWN / FORMS_GET_REVISION_BUMPED
```

## test 実装一覧

```
apps/api/src/sync/schema/
├── flatten.test.ts                # AC-1
├── schema-hash.test.ts            # AC-1 補強（hash 安定性）
├── resolve-stable-key.test.ts     # AC-3
├── diff-queue-writer.test.ts      # AC-2
└── forms-schema-sync.test.ts      # AC-1 / AC-2 / AC-4 / AC-5 / AC-6 / AC-8

apps/api/src/routes/admin/
└── sync-schema.test.ts            # contract + authz（401 / 403 / 500 / 200 / 409）
```
