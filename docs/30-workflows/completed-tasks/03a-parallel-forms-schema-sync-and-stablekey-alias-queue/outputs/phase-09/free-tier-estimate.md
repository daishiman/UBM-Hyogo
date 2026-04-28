# free-tier-estimate — forms-schema-sync (03a)

Cloudflare Workers / D1 / Forms API の 3 軸で 1 日コストを見積もる。

---

## 1. Workers 実行回数

| トリガー | 頻度 | コメント |
| --- | --- | --- |
| cron `0 18 * * *` | 1 / 日 | schema sync |
| cron `*/15 * * * *` | 96 / 日 | sheets sync（既存・本タスク対象外） |
| manual `POST /admin/sync/schema` | < 5 / 日（運用想定） | wave 8b の admin UI から手動実行 |

**合計 < 110 invocations / 日**。Workers Free tier (100,000 / 日) の 0.11% 以下。

---

## 2. D1 read / write

`runSchemaSync` 1 回あたり:

| 操作 | 件数 |
| --- | --- |
| read（syncJobs.findLatest） | 1 |
| write（syncJobs.start） | 1 |
| write（schema_versions.upsertManifest） | 1 |
| read（schemaQuestions.findStableKeyByQuestionId） | 31 |
| write（schemaQuestions.upsertField） | 31 |
| read（diffQueueWriter 既存チェック） | 0〜31（unknown 件数） |
| write（diff_queue insert） | 0〜数件 |
| write（syncJobs.succeed/fail） | 1 |

**最大 1 sync で read 64 / write 35**。日 1 cron + 手動 5 = 6 sync で **read 384 / write 210**。

D1 Free tier: read 5,000,000 / 日, write 100,000 / 日 → 余裕。

---

## 3. Forms API quota

- `forms.get` 1 sync で 1 回。日 6 回程度。
- Forms API quota: 60 req / 分 / project（無料）→ 余裕。

---

## 4. 結論

無料枠は十分。スパイクが起きても /15 分 sheets sync と衝突しない（ConflictError は別 jobType のため発生しない）。
