# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 4（テスト戦略） |
| 次 Phase | 6（異常系検証） |
| 状態 | pending |

## 目的

response 同期の実装手順を runbook 化、擬似コード + sanity check + local dev 手順を整備する。

## 実行タスク

1. runbook 章立て（前提 / module / 関数 / endpoint / cron / test / local dev）。
2. 擬似コード（runResponseSync / normalizeAnswer / extractConsent / resolveIdentity / pickCurrentResponse / snapshotConsent / cursorStore）。
3. sanity check command。
4. local dev 手順。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | module 配置 |
| 必須 | outputs/phase-04/main.md | test |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | flow |

## 実行手順

### ステップ 1: runbook 章立て
- 章 1 前提 / 章 2 module / 章 3 関数本体 / 章 4 endpoint / 章 5 cron / 章 6 test / 章 7 local dev

### ステップ 2: 擬似コード
- 後述参照。

### ステップ 3: sanity check
- 後述参照。

### ステップ 4: local dev
- 後述参照。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook の正常路から外れた場合 |
| Phase 7 | runbook 章 → AC mapping |
| Phase 11 | 手動 smoke で実行 |
| Wave 9a | staging で実行 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent キー | #2 | runbook で旧 ruleConsent 検査を含む |
| responseEmail | #3 | runbook で member_responses.response_email 列に書く手順 |
| 上書き禁止 | #4 | runbook で既存 responseId の field 削除手順を持たない |
| ID 混同 | #7 | runbook の擬似コードで型 brand 使用 |
| schema 集約 | #14 | unknown field を必ず queue 投入 |
| 無料枠 | #10 | cron */15 + per sync write 200 row 制限 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 章立て | 5 | pending | 7 章 |
| 2 | 擬似コード | 5 | pending | 7 関数 |
| 3 | sanity check | 5 | pending | typecheck / lint / test |
| 4 | local dev | 5 | pending | wrangler |
| 5 | outputs 分離 | 5 | pending | sync-runbook.md / pseudocode.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook サマリ |
| ドキュメント | outputs/phase-05/sync-runbook.md | 本文 |
| ドキュメント | outputs/phase-05/pseudocode.md | 擬似コード |
| メタ | artifacts.json | phase 5 を `completed` |

## 完了条件

- [ ] runbook 7 章
- [ ] 擬似コード 7 関数
- [ ] sanity check / local dev あり

## タスク100%実行確認【必須】

- [ ] サブタスク 5 件すべて completed
- [ ] 擬似コードに `Brand<>` 型 import がある
- [ ] runbook に「unknown field の queue 投入」手順がある
- [ ] runbook に「consent snapshot は public_consent / rules_consent のみ」明記
- [ ] artifacts.json の phase 5 が `completed`

## 次 Phase

- 次: 6（異常系検証）

## runbook（章立て）

### 章 1: 前提
- branch: `feature/sync-responses`
- env: staging
- D1 binding: `DB`、migration apply 済み
- secret: GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_FORM_ID

### 章 2: module スケルトン
- `apps/api/src/sync/responses/{forms-response-sync,normalize-answer,extract-consent,resolve-identity,pick-current-response,snapshot-consent,cursor-store}.ts`

### 章 3: 関数本体
- 後述「擬似コード」順。

### 章 4: endpoint
- `app.post('/admin/sync/responses', adminGate, handler)`、`?fullSync=true` で cursor 無視

### 章 5: cron
- `crons = ["*/15 * * * *", "0 3 * * *"]` の `*/15` で `runResponseSync(env)`

### 章 6: test
- `pnpm --filter @ubm/api test`、`pnpm typecheck`、`pnpm lint`

### 章 7: local dev dry run
- `pnpm --filter @ubm/api dev`
- `curl -X POST http://localhost:8787/admin/sync/responses -H 'Authorization: Bearer dev-admin'`
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM member_responses"` → fixture 件数
- `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(DISTINCT response_email) FROM member_identities"` → unique email 数

## 擬似コード

```ts
// apps/api/src/sync/responses/forms-response-sync.ts
export async function runResponseSync(env: Env, opts: { fullSync?: boolean } = {}): Promise<RunResult> {
  const jobId = crypto.randomUUID()
  const lock = await syncJobs.tryAcquire({ kind: 'response_sync', jobId })
  if (!lock) throw new ConflictError('response_sync already running')

  try {
    let cursor = opts.fullSync ? undefined : await cursorStore.read({ kind: 'response_sync' })
    let processed = 0
    let writes = 0

    while (true) {
      const page = await googleFormsClient.listResponses(env.GOOGLE_FORM_ID, { pageToken: cursor })
      for (const resp of page.responses) {
        await processResponse(resp, env)
        processed += 1
        writes += estimateWrite(resp)
      }
      cursor = page.nextPageToken
      await cursorStore.write({ kind: 'response_sync', cursor })
      if (!cursor) break
      if (writes > 200) break // 無料枠保護: 1 ジョブで 200 row 超過なら次回継続
    }

    await syncJobs.markSucceeded(jobId, { processed, writes })
    return { jobId, status: 'succeeded', processedCount: processed }
  } catch (e) {
    await syncJobs.markFailed(jobId, e)
    throw e
  }
}

async function processResponse(resp: GoogleFormResponse, env: Env): Promise<void> {
  const responseId = resp.responseId as ResponseId
  const responseEmail = resp.respondentEmail
  const submittedAt = resp.lastSubmittedTime ?? resp.createTime

  // 1. member_identities
  const memberId = await resolveIdentity({ responseEmail, responseId, submittedAt }, env) // upsert
  // 2. member_responses
  await memberResponsesRepo.upsert({ responseId, memberId, responseEmail, submittedAt, schemaRevisionId: resp.revisionId, rawJson: resp })
  // 3. response_fields (known + extra)
  const normalized = await normalizeAnswer(resp.answers, env) // returns { known: Map<stableKey, value>, unknown: Map<questionId, value> }
  await responseFieldsRepo.upsertKnown(responseId, normalized.known)
  await responseFieldsRepo.upsertExtra(responseId, normalized.unknown)
  for (const questionId of normalized.unknown.keys()) {
    await schemaDiffQueueRepo.enqueue({ questionId, diffKind: 'unresolved' })
  }
  // 4. current_response 切替
  await pickCurrentResponse({ memberId, responseId, submittedAt })
  // 5. consent snapshot（is_deleted=false のみ）
  const consent = extractConsent(normalized.known) // { publicConsent, rulesConsent }
  await snapshotConsent({ memberId, ...consent })
}

// apps/api/src/sync/responses/extract-consent.ts
export function extractConsent(known: Map<StableKey, string>): { publicConsent: ConsentStatus; rulesConsent: ConsentStatus } {
  const pubRaw = known.get('publicConsent') ?? known.get('ruleConsent') /* alias */ ?? ''
  const rulRaw = known.get('rulesConsent') ?? known.get('ruleConsent') /* legacy */ ?? ''
  return {
    publicConsent: normalizeConsent(pubRaw),
    rulesConsent: normalizeConsent(rulRaw),
  }
}
function normalizeConsent(raw: string): ConsentStatus {
  if (['同意する', '同意します', 'yes'].includes(raw)) return 'consented'
  if (['同意しない', 'no'].includes(raw)) return 'declined'
  return 'unknown'
}

// apps/api/src/sync/responses/resolve-identity.ts
export async function resolveIdentity(input: { responseEmail: string; responseId: ResponseId; submittedAt: number }, env: Env): Promise<MemberId> {
  const existing = await memberIdentitiesRepo.findByEmail(input.responseEmail)
  if (existing) {
    if (input.submittedAt > existing.lastSubmittedAt) {
      // current は pickCurrentResponse で切替するためここでは email / last_submitted のみ
      await memberIdentitiesRepo.touchLastSubmitted({ memberId: existing.memberId, lastSubmittedAt: input.submittedAt })
    }
    return existing.memberId
  }
  const newMemberId = crypto.randomUUID() as MemberId
  await memberIdentitiesRepo.insert({ memberId: newMemberId, responseEmail: input.responseEmail, currentResponseId: input.responseId, firstResponseId: input.responseId, lastSubmittedAt: input.submittedAt })
  return newMemberId
}

// apps/api/src/sync/responses/pick-current-response.ts
export async function pickCurrentResponse(input: { memberId: MemberId; responseId: ResponseId; submittedAt: number }) {
  const cur = await memberIdentitiesRepo.findByMemberId(input.memberId)
  if (!cur) return
  if (input.submittedAt > cur.lastSubmittedAt
    || (input.submittedAt === cur.lastSubmittedAt && input.responseId > cur.currentResponseId)) {
    await memberIdentitiesRepo.setCurrent({ memberId: input.memberId, currentResponseId: input.responseId, lastSubmittedAt: input.submittedAt })
  }
}

// apps/api/src/sync/responses/snapshot-consent.ts
export async function snapshotConsent(input: { memberId: MemberId; publicConsent: ConsentStatus; rulesConsent: ConsentStatus }) {
  const status = await memberStatusRepo.findByMemberId(input.memberId)
  if (status?.isDeleted) return
  await memberStatusRepo.updateConsent({ memberId: input.memberId, publicConsent: input.publicConsent, rulesConsent: input.rulesConsent })
}
```

## sanity check

```bash
pnpm typecheck
pnpm lint
pnpm --filter @ubm/api test
pnpm --filter @ubm/api build
wrangler d1 execute ubm_hyogo_staging --local --command "SELECT kind,status,payload FROM sync_jobs WHERE kind='response_sync' ORDER BY started_at DESC LIMIT 5"
```

## local dev runbook

1. `pnpm install`
2. `pnpm --filter @ubm/api db:migrate:local`
3. `pnpm --filter @ubm/api dev`
4. `curl -X POST http://localhost:8787/admin/sync/responses -H 'Authorization: Bearer dev-admin'`
5. `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT count(*) FROM member_responses"`
6. `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT response_email, current_response_id, last_submitted_at FROM member_identities ORDER BY last_submitted_at DESC LIMIT 5"`
7. `wrangler d1 execute ubm_hyogo_staging --local --command "SELECT public_consent, rules_consent FROM member_status WHERE is_deleted=0 LIMIT 5"`
