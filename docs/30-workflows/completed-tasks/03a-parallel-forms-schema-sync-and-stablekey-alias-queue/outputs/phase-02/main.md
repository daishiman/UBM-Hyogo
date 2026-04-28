# Phase 2 成果物: 設計 — forms-schema-sync-and-stablekey-alias-queue

Phase 1 の scope / AC を入力に、`apps/api` 配下の **module 配置 / 同期 flow / SQL 擬似 / env / dependency matrix** を確定する。既存の `packages/integrations/google/src/forms/*` と `apps/api/src/repository/{schemaVersions,schemaQuestions,schemaDiffQueue,syncJobs}.ts` を **新規実装せず呼び出す**前提。

---

## 1. module 配置

```
apps/api/src/sync/schema/
├── index.ts                  # runSchemaSync(env, deps) のみ export
├── forms-schema-sync.ts      # job 関数 entry: lock → fetch → flatten → upsert → ledger close
├── flatten.ts                # RawForm.items[] → flat question list[] (sectionIndex 採番)
├── resolve-stable-key.ts     # known map(D1) + alias テーブル参照で stableKey を返す
├── diff-queue-writer.ts      # schemaDiffQueueRepository.enqueue() の薄いラッパ
├── schema-hash.ts            # SHA-256(sorted items JSON)
└── known-stable-keys.ts      # ※ 値ではなく D1 ロード関数のみ。リテラル直書き禁止

apps/api/src/routes/admin.ts
└── app.post('/admin/sync/schema', adminGate, async (c) =>
      withAdminRoute(c, () => runSchemaSync(c.env, makeDeps(c))))

apps/api/src/cron/index.ts
└── case '0 18 * * *': await runSchemaSync(env, makeDeps({ env }))
```

### 各モジュール責務

| モジュール | 入力 | 出力 / 副作用 |
| --- | --- | --- |
| `forms-schema-sync.ts` | env, deps（formsClient, db, now, uuid） | `sync_jobs` ledger 開始/終了、`schema_versions` upsert、items loop、結果 metrics |
| `flatten.ts` | `RawForm` | `FlatQuestion[]`（`{ questionId, itemId, title, kind, options[], sectionIndex, sectionTitle, position, required }`） |
| `resolve-stable-key.ts` | `FlatQuestion`, `aliasMap` | `{ stableKey: string \| null, source: 'alias' \| 'known' \| 'unknown' }` |
| `diff-queue-writer.ts` | `revisionId, FlatQuestion, suggestedStableKey?` | `schemaDiffQueueRepository.enqueue` 呼び出し（`type='added'`, `status='queued'`） |
| `schema-hash.ts` | `RawForm.items[]` | SHA-256 hex（並びを正規化） |
| `known-stable-keys.ts` | `db` | D1 から alias / known マップを読み込む関数のみ。リテラルなし |

> **AC-7 担保**: stableKey 文字列は `apps/api/src/sync/schema/**` のいかなる `.ts` にも書かない。ESLint custom rule（`no-stable-key-literal`）でガード。

---

## 2. 同期 flow（Mermaid）

`outputs/phase-02/sync-flow.mermaid` を参照。重要点:

- 起点は **cron（`0 18 * * *` UTC (03:00 JST)）** または **`POST /admin/sync/schema`** の 2 経路。どちらも `runSchemaSync` を呼ぶ。
- **lock**: `sync_jobs` に `job_type='schema_sync' AND status='running'` row があれば 409 で reject。
- **fetch**: `googleFormsClient.getForm(env.GOOGLE_FORM_ID)` を `withBackoff` 経由で実行。
- **flatten**: `items[]` を順走、`sectionHeaderItem` 出現で `sectionIndex` をインクリメント、`questionItem` のみ抽出。
- **hash**: items の正規化 JSON を SHA-256 → `schemaHash`。
- **upsert versions**: `revisionId` キーで upsert（再実行時は `synced_at` のみ更新）。
- **resolve loop**: 31 question について `resolveStableKey` → 既知なら `schema_questions.stable_key` 付与 / 未知なら NULL upsert + `schema_diff_queue` 投入。
- **removed sweep**: 直前 revision に存在し今回欠落した questionId に対して `schema_diff_queue.type='removed'` を投入。
- **assertion**: count(item)=31, count(section)=6 を検証。NG なら `failed`。
- **ledger close**: `succeeded` / `failed` を `sync_jobs` に書き、`metrics_json` に upserted / diffEnqueued / removed を残す。

---

## 3. SQL 擬似コード

```sql
-- (1) ledger insert（lock 兼）
INSERT INTO sync_jobs (job_id, job_type, status, started_at, metrics_json, error_json)
VALUES (?, 'schema_sync', 'running', strftime('%s','now'), '{}', NULL);
-- 競合検知: 別 row が 'running' で存在 → アプリ層で SELECT 確認 → 409
SELECT 1 FROM sync_jobs
WHERE job_type='schema_sync' AND status='running' AND job_id <> ?;

-- (2) schema_versions upsert by revisionId（冪等 / AC-4）
INSERT INTO schema_versions
  (form_id, revision_id, schema_hash, state, synced_at, source_url, field_count, unknown_field_count)
VALUES (?, ?, ?, 'active', strftime('%s','now'), ?, ?, ?)
ON CONFLICT(revision_id) DO UPDATE SET
  synced_at           = excluded.synced_at,
  schema_hash         = excluded.schema_hash,
  field_count         = excluded.field_count,
  unknown_field_count = excluded.unknown_field_count;
-- 直前 active を superseded に降格（schemaHash が変わった場合のみ）
UPDATE schema_versions SET state='superseded'
WHERE form_id=? AND revision_id <> ? AND state='active';

-- (3) schema_questions upsert（31 回ループ / stableKey は COALESCE で温存）
INSERT INTO schema_questions
  (question_pk, revision_id, stable_key, question_id, item_id,
   section_key, section_title, label, kind, position,
   required, visibility, searchable, status, choice_labels_json)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
ON CONFLICT(question_pk) DO UPDATE SET
  revision_id        = excluded.revision_id,
  stable_key         = COALESCE(excluded.stable_key, schema_questions.stable_key),
  label              = excluded.label,
  kind               = excluded.kind,
  position           = excluded.position,
  required           = excluded.required,
  visibility         = excluded.visibility,
  choice_labels_json = excluded.choice_labels_json,
  status             = 'active';

-- (4) schema_diff_queue 投入（unresolved = stable_key IS NULL の question / AC-2）
INSERT INTO schema_diff_queue
  (diff_id, revision_id, type, question_id, stable_key, label, suggested_stable_key, status, created_at)
VALUES (?, ?, 'added', ?, NULL, ?, ?, 'queued', strftime('%s','now'))
ON CONFLICT(question_id, status) WHERE status='queued' DO NOTHING;

-- (5) 削除検出（前 revision 比）
INSERT INTO schema_diff_queue
  (diff_id, revision_id, type, question_id, stable_key, label, suggested_stable_key, status, created_at)
SELECT lower(hex(randomblob(16))), ?, 'removed', sq.question_id, sq.stable_key, sq.label, NULL, 'queued', strftime('%s','now')
FROM schema_questions sq
WHERE sq.revision_id = ? -- prev
  AND sq.question_id NOT IN (SELECT question_id FROM schema_questions WHERE revision_id = ?); -- now

-- (6) ledger close（succeeded / failed / AC-5）
UPDATE sync_jobs
SET status = ?, finished_at = strftime('%s','now'), metrics_json = ?, error_json = ?
WHERE job_id = ?;
```

> 注: 既存 repository（`schemaVersions.ts` / `schemaQuestions.ts` / `schemaDiffQueue.ts` / `syncJobs.ts`）が上記 SQL を内包する関数を提供している前提。Phase 5 で必要なら薄い helper を追加する。

---

## 4. Forms API 呼び出し placeholder

```ts
// apps/api/src/sync/schema/forms-schema-sync.ts
import { type GoogleFormsClient } from "@ubm-hyogo/integrations/google/forms";

export async function runSchemaSync(env: Env, deps: SchemaSyncDeps): Promise<SchemaSyncResult> {
  const jobId = deps.uuid();
  await deps.repos.syncJobs.start({ jobId, jobType: "schema_sync" }); // 409 は repo が throw
  try {
    const form = await deps.formsClient.getForm(env.GOOGLE_FORM_ID); // FormSchema 型
    const flat = flatten(form.raw); // RawForm を扱う場合は client から raw も取得 / 別 API
    const schemaHash = sha256(canonicalize(form.raw.items ?? []));
    await deps.repos.schemaVersions.upsertByRevisionId({
      formId: env.GOOGLE_FORM_ID,
      revisionId: form.raw.revisionId!,
      schemaHash,
      sourceUrl: env.GOOGLE_FORM_RESPONDER_URL,
      fieldCount: flat.length,
      unknownFieldCount: 0, // 後で再計算
    });
    const aliasMap = await deps.repos.schemaQuestions.loadAliasMap(env.GOOGLE_FORM_ID);
    let unknown = 0;
    for (const q of flat) {
      const resolved = resolveStableKey(q, aliasMap);
      await deps.repos.schemaQuestions.upsertByQuestionPk({ ...q, stableKey: resolved.stableKey });
      if (resolved.stableKey === null) {
        unknown++;
        await deps.repos.schemaDiffQueue.enqueue({
          revisionId: form.raw.revisionId!,
          type: "added",
          questionId: q.questionId,
          stableKey: null,
          label: q.title,
          suggestedStableKey: resolved.suggested ?? null,
        });
      }
    }
    await deps.repos.schemaDiffQueue.enqueueRemovedAgainstPrev(form.raw.revisionId!);
    assertCounts(flat); // item=31, section=6
    await deps.repos.syncJobs.succeed(jobId, { upserted: flat.length, diffEnqueued: unknown });
    return { ok: true, jobId, revisionId: form.raw.revisionId!, upserted: flat.length };
  } catch (e) {
    await deps.repos.syncJobs.fail(jobId, normalizeError(e));
    throw e;
  }
}
```

---

## 5. 環境変数 / secret

| 区分 | 変数名 | 配置 | 担当 | 本タスクで導入? |
| --- | --- | --- | --- | --- |
| Forms 認証 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Cloudflare Secrets (apps/api) | infra 04 | 既出 |
| Forms 認証 | `GOOGLE_PRIVATE_KEY` | Cloudflare Secrets (apps/api) | infra 04 | 既出 |
| Forms 識別子 | `GOOGLE_FORM_ID` | Cloudflare Secrets (apps/api) | infra 04 | 既出 |
| 任意 | `GOOGLE_FORM_RESPONDER_URL` | Cloudflare Vars | infra 04 | 既出 |

**新規 secret は導入しない**（不変条件 #10 / Cloudflare Secrets 一元管理）。

---

## 6. dependency matrix

| 種別 | 対象タスク | 引き渡し物 | 方向 |
| --- | --- | --- | --- |
| 上流 | 01b | `googleFormsClient.getForm(formId)` の戻り型 / `RawForm` mapper / `withBackoff` | 入 |
| 上流 | 02b | `schemaVersionsRepository.upsertByRevisionId()`, `schemaQuestionsRepository.upsertByQuestionPk()`, `schemaQuestionsRepository.loadAliasMap()`, `schemaDiffQueueRepository.enqueue()`, `schemaDiffQueueRepository.enqueueRemovedAgainstPrev()`, `syncJobsRepository.start/succeed/fail()` | 入 |
| 上流 | 02a | members repository（fixture 共有のみ。ランタイム参照なし） | 弱 |
| 下流 | 04c | `POST /admin/sync/schema` handler が `runSchemaSync(env, deps)` を呼ぶ | 出 |
| 下流 | 07b | `schemaDiffQueueRepository.listQueued()` で resolve 対象を読み、確定後に `resolved` へ遷移 | 出 |
| 並列 | 03b | `sync_jobs` の `job_type` 区別ロックを共通化（`schema_sync` / `response_sync`）| 並 |

---

## 7. 不変条件適合チェック

| # | 不変条件 | 設計上の適合 |
| --- | --- | --- |
| #1 | stableKey 直書き禁止 | `resolve-stable-key.ts` が D1 alias を引く。ESLint `no-stable-key-literal`（AC-7）で gate |
| #5 | apps/api 限定 | sync module は `apps/api/src/sync/schema/` 配下のみ。`apps/web` から D1 直アクセスなし |
| #6 | GAS 排除 | Forms API + Workers のみ。GAS prototype のコードを import しない |
| #10 | 無料枠 | cron 1 日 1 回 + 手動。`withBackoff` 上限化、`revisionId` 同一は no-op |
| #14 | schema 集約 | diff 検出は `schema_diff_queue` に集約、`/admin/schema`（06c）が 1 入口 |

---

## 8. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | module 配置決定 | completed |
| 2 | Mermaid flow 作成（`sync-flow.mermaid`） | completed |
| 3 | SQL 擬似化（upsert + diff queue 両方含む） | completed |
| 4 | env 整合確認（新規 secret なし） | completed |
| 5 | dependency matrix（02a / 02b / 01b / 04c / 07b / 03b 全登場）| completed |

---

## 9. Phase 3 への引き継ぎ

- **採用設計**: §1〜§4 を採用案 A とする。
- **alternative 候補**: B（手動のみ） / C（1 時間 cron + JSON manifest stableKey） / D（Forms watch push）。
- **リスク事前列挙**: Forms API quota / 鍵漏洩 / 同種 job 並行 / revision 重複 / 既知 stableKey 取りこぼし / unresolved 漏れ。
- **open question**: 削除検出（removed sweep）の `schema_diff_queue.type='removed'` を運用上 `queued` で持つか即時 `resolved` で持つかは Phase 3 で確認。
