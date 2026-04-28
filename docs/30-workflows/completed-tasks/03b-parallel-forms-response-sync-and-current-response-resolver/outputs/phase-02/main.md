# Phase 2 成果物: 設計（03b: forms-response-sync-and-current-response-resolver）

## 1. サマリ

response 同期の責務を `apps/api/src/sync/responses/` に閉じ、`sync_jobs` ledger による排他 lock と cursor pagination を `_shared/ledger.ts` に集約する。同期 flow は `forms.responses.list` → normalize（stableKey 解決）→ extractConsent → resolveIdentity → response upsert → unknown enqueue → pickCurrentResponse → snapshotConsent の 7 ステップで構成される。SQL は `member_identities` の `last_submitted_at` 比較による current_response 切替、`schema_diff_queue` の `ON CONFLICT … WHERE status='queued' DO NOTHING` による重複排除、`member_status` の consent 列限定 update を要点とする。

## 2. module 配置

```
apps/api/src/
├── sync/
│   ├── _shared/
│   │   ├── ledger.ts                    # 03a と共通: sync_jobs lock / status 遷移 / cursor RW
│   │   └── sync-error.ts                # SyncError class（job_type=response_sync 用 code 定義）
│   └── responses/
│       ├── index.ts                     # public export: runResponseSync
│       ├── forms-response-sync.ts       # job entry: runResponseSync(env, opts?: { fullSync?: boolean })
│       ├── normalize-answer.ts          # rawAnswersByQuestionId + answersByStableKey 構築
│       ├── extract-consent.ts           # publicConsent / rulesConsent → consented|declined|unknown
│       ├── resolve-identity.ts          # responseEmail → MemberId, member_identities upsert
│       ├── pick-current-response.ts     # submittedAt desc / responseId lex max
│       ├── snapshot-consent.ts          # member_status.public_consent / rules_consent のみ更新
│       └── cursor-store.ts              # sync_jobs.metrics_json.cursor read / write
├── routes/
│   └── admin.ts                         # app.post('/admin/sync/responses', adminGate, handler)
├── cron/
│   └── index.ts                         # if cron === '*/15 * * * *' → runResponseSync(env)
└── repository/
    ├── responses.ts (既存)              # 02a: upsertByResponseId
    ├── responseSections.ts (既存)       # 02a: upsertMany
    ├── responseFields.ts (既存)         # 02a: upsertKnown / upsertExtra
    ├── identities.ts (既存)             # 02a: upsertByResponseEmail
    ├── status.ts (既存)                 # 02a: applyConsentSnapshot
    ├── syncJobs.ts (既存)               # acquireRunningLock / completeWithCursor
    └── schemaDiffQueue.ts (既存)        # 02b: enqueueIfAbsent
```

### 2.1 各 module の I/O 契約

| module | 入力 | 出力 | 主たる副作用 |
| --- | --- | --- | --- |
| `forms-response-sync.runResponseSync` | `env`, `{ fullSync?: boolean, cursor?: string }` | `{ jobId, totalRows, nextCursor? }` | sync_jobs / member_responses ほか D1 全般 |
| `normalize-answer.normalize` | `rawResponse, schemaQuestionMap` | `{ answersByStableKey, rawAnswersByQuestionId, unknownQuestionIds[] }` | 純関数 |
| `extract-consent.extract` | `answersByStableKey` | `{ publicConsent: ConsentValue, rulesConsent: ConsentValue }` | 純関数（`ruleConsent` alias 正規化） |
| `resolve-identity.resolve` | `responseEmail, responseId, submittedAt` | `MemberId` | `member_identities` upsert |
| `pick-current-response.pick` | `memberId` | `{ currentResponseId, submittedAt }` | read のみ（caller が UPDATE） |
| `snapshot-consent.apply` | `memberId, consents` | void | `member_status` UPDATE（is_deleted ガード） |
| `cursor-store.{read,write}` | `jobId` / `jobId, cursor` | `string \| null` / void | `sync_jobs.metrics_json` JSON patch |
| `_shared/ledger.acquire` | `job_type='response_sync'` | `{ jobId } \| { conflict: true }` | `sync_jobs` INSERT |

### 2.2 brand 型（不変条件 #7 / AC-7）

```ts
type Brand<T, B> = T & { readonly __brand: B }
type ResponseId = Brand<string, 'ResponseId'>
type MemberId   = Brand<string, 'MemberId'>
type ConsentValue = 'consented' | 'declined' | 'unknown'
```

## 3. Mermaid フロー

別ファイル: `outputs/phase-02/sync-flow.mermaid` 参照。8 つの判定分岐（lock / fullSync / unknown / is_deleted / nextPage / writeCap / loop 失敗）を含む。

## 4. SQL 擬似コード

### 4.1 ledger 取得（排他 lock / AC-6）

```sql
-- acquireRunningLock: 既に running の同 job_type があれば conflict
INSERT INTO sync_jobs (id, job_type, status, started_at, metrics_json)
SELECT ?, 'response_sync', 'running', strftime('%s','now'), json_object('cursor', ?)
WHERE NOT EXISTS (
  SELECT 1 FROM sync_jobs WHERE job_type='response_sync' AND status='running'
);
-- changes() = 0 のとき 409 Conflict を返却
```

### 4.2 member_identities upsert（current_response 切替 / AC-1）

```sql
INSERT INTO member_identities (
  member_id, response_email, current_response_id, first_response_id, last_submitted_at, is_deleted
)
VALUES (?, ?, ?, ?, ?, 0)
ON CONFLICT(response_email) DO UPDATE SET
  current_response_id = CASE
    WHEN excluded.last_submitted_at >  member_identities.last_submitted_at
      THEN excluded.current_response_id
    WHEN excluded.last_submitted_at =  member_identities.last_submitted_at
     AND excluded.current_response_id > member_identities.current_response_id  -- lex max
      THEN excluded.current_response_id
    ELSE member_identities.current_response_id
  END,
  last_submitted_at = MAX(member_identities.last_submitted_at, excluded.last_submitted_at);
```

### 4.3 member_responses upsert（不変条件 #4 / AC-4）

```sql
INSERT INTO member_responses (
  response_id, member_id, response_email, submitted_at, schema_revision_id, raw_json
)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(response_id) DO UPDATE SET
  submitted_at       = excluded.submitted_at,
  schema_revision_id = excluded.schema_revision_id,
  raw_json           = excluded.raw_json;
-- 旧 responseId の row は touch しない（履歴保持 / 不変条件 #4）
-- response_email は system field として member_responses 側のみに保持（response_fields 非保存）
```

### 4.4 response_fields upsert（known / unknown）

```sql
-- known stableKey
INSERT INTO response_fields (response_id, stable_key, value_text, value_json, raw_question_id)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(response_id, stable_key) DO UPDATE SET
  value_text = excluded.value_text,
  value_json = excluded.value_json;

-- unknown（stable_key=NULL, extra field row (`response_fields.stable_key=__extra__:<questionId>`) に値）
INSERT INTO response_fields (response_id, stable_key, value_text, value_json, raw_question_id, extra field row (`response_fields.stable_key=__extra__:<questionId>`))
VALUES (?, NULL, NULL, NULL, ?, ?)
ON CONFLICT(response_id, raw_question_id) DO NOTHING;
```

### 4.5 schema_diff_queue enqueue（AC-2 / 不変条件 #14）

```sql
INSERT INTO schema_diff_queue (id, question_id, diff_kind, detected_at, status)
VALUES (?, ?, 'unresolved', strftime('%s','now'), 'open')
ON CONFLICT(question_id) WHERE status='queued' DO NOTHING;
```

### 4.6 consent snapshot（AC-3 / AC-9 / 不変条件 #2）

```sql
UPDATE member_status
SET public_consent = ?, rules_consent = ?
WHERE member_id = ?
  AND EXISTS (
    SELECT 1 FROM member_identities
    WHERE member_identities.member_id = member_status.member_id
      AND member_identities.is_deleted = 0
  );
-- publish_state / is_deleted 列は SET 句に含めない（不可侵）
```

### 4.7 ledger close（cursor 永続化 / AC-5 / AC-10）

```sql
UPDATE sync_jobs
SET status       = 'succeeded',
    completed_at = strftime('%s','now'),
    metrics_json      = json_set(metrics_json, '$.cursor', ?, '$.write_count', ?)
WHERE id = ?;
```

## 5. 環境変数

| 区分 | 変数名 | 配置 | 状態 |
| --- | --- | --- | --- |
| Forms 認証 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Cloudflare Secrets | 既出（01b） |
| Forms 認証 | `GOOGLE_PRIVATE_KEY` | Cloudflare Secrets | 既出（01b） |
| 識別子 | `GOOGLE_FORM_ID` | Cloudflare Secrets | 既出 |

新規 secret なし。

## 6. dependency matrix

| 種別 | 対象タスク | 引き渡し物 | 本タスクでの利用箇所 |
| --- | --- | --- | --- |
| 上流 | 01b | `googleFormsClient.listResponses(formId, { pageToken? })` 戻り型（responses[], nextPageToken?） | `forms-response-sync.ts` |
| 上流 | 02a | `memberResponsesRepository` / `responseSectionsRepository` / `responseFieldsRepository` / `memberIdentitiesRepository` / `memberStatusRepository` / `syncJobsRepository` | sync 全 module |
| 上流 | 02b | `schemaQuestionsRepository.findStableKeyByQuestionId` / `schemaDiffQueueRepository.enqueueIfAbsent` | `normalize-answer.ts` / unknown 投入 |
| 並列 | 03a | `_shared/ledger.ts` を共通化（sync_jobs lock / status 遷移） | `_shared/ledger.ts` |
| 下流 | 04a | current_response + member_status を view model 化（公開ディレクトリ） | output として member_status / member_responses |
| 下流 | 04b | `/me/profile` で current_response を read | `current_response_id` の参照保証 |
| 下流 | 04c | `POST /admin/sync/responses` を expose（admin route） | `routes/admin.ts` |
| 下流 | 07a | response 更新後に tag queue を起動（option として post-hook） | sync 完了通知 hook（07a 側で監視） |
| 下流 | 07c | is_deleted の確認源として member_status を共有 | `member_status` consent 限定更新の保証 |

## 7. cron 配線

```ts
// apps/api/src/cron/index.ts
export async function scheduled(event: ScheduledEvent, env: Env) {
  if (event.cron === '*/15 * * * *') {
    await runResponseSync(env)              // 03b
  } else if (event.cron === '*/30 * * * *') {
    await runSchemaSync(env)                // 03a（並列）
  }
}
```

## 8. AC トレーサビリティ（Phase 2 視点）

| AC | 設計上の担保 module / SQL |
| --- | --- |
| AC-1 | `pick-current-response.ts` + §4.2 SQL（CASE 比較で lex max tiebreak） |
| AC-2 | `normalize-answer.ts` + §4.4（extra）+ §4.5（diff queue） |
| AC-3 | `snapshot-consent.ts` + §4.6（consent 列のみ UPDATE） |
| AC-4 | §4.3（response_email を `member_responses` 列に保存）+ `normalize-answer` で responseEmail を answers から除外 |
| AC-5 | `forms-response-sync.ts` の `fullSync` opt + `cursor-store.ts` |
| AC-6 | `_shared/ledger.acquire` + §4.1 SQL（`WHERE NOT EXISTS`） |
| AC-7 | §2.2 brand 型 |
| AC-8 | `extract-consent.ts` で `ruleConsent` alias 正規化（lint で grep 検出は CI 側） |
| AC-9 | §4.6 SQL の `EXISTS … is_deleted=0` ガード |
| AC-10 | `forms-response-sync.ts` の writeCap 200 行 + 次 cron 持ち越し |

## 9. 不変条件マッピング

| 不変条件 | 触れる module / SQL |
| --- | --- |
| #1 schema 固定禁止 | `normalize-answer.ts`（schema_questions 引き） |
| #2 consent キー統一 | `extract-consent.ts` + §4.6 |
| #3 responseEmail = system field | §4.3 + `normalize-answer.ts`（除外処理） |
| #4 profile 本文編集禁止 | §4.3（同 responseId のみ上書き、旧 row 不変） |
| #5 apps/api | 全 module を `apps/api/src/sync/responses/` 配下 |
| #6 GAS 排除 | Forms API + Workers のみ |
| #7 ID 混同禁止 | §2.2 brand |
| #10 無料枠 | writeCap + cursor 持ち越し |
| #14 schema 集約 | §4.5 |

## 10. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | module 配置 | completed |
| 2 | Mermaid（sync-flow.mermaid） | completed |
| 3 | SQL 擬似（upsert / current / consent の 3 種＋ledger / queue / fields）| completed |
| 4 | env 整合（新規なし） | completed |
| 5 | dependency matrix（02a/02b/01b/03a/04a/04b/04c/07a/07c） | completed |

## 11. 次 Phase 引き継ぎ

- Phase 3 入力: 採用案（A: cursor=sync_jobs.metrics_json, cron */15）
- Phase 3 で扱う事項: alternative B/C/D の比較、PASS-MINOR-MAJOR 判定、リスク登録（cursor lost / Forms quota / responseEmail 重複 / unknown 漏れ / 二重起動 / consent 上書き / tiebreak / ruleConsent 旧名）
- ブロック: なし
