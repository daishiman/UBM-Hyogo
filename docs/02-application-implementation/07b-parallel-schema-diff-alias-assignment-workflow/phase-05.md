# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07b-parallel-schema-diff-alias-assignment-workflow |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

schema alias workflow 本体（apply / dryRun）、alias 推奨、back-fill batch、endpoint handler の実装手順を runbook + 擬似コード化する。

## 実行タスク

1. ファイル作成順序
2. zod schema 擬似コード
3. schemaAliasAssign workflow 擬似コード（apply / dryRun）
4. recommendAliases 擬似コード（Levenshtein + section/index）
5. backfillResponseFields 擬似コード（batch loop）
6. endpoint handler 擬似コード
7. sanity check

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/schema-alias-workflow-design.md | 設計図 |
| 必須 | outputs/phase-04/schema-alias-test-strategy.md | assertion |

## 実行手順

### ステップ 1: 作成順

1. `apps/api/src/schemas/schemaAliasAssign.ts`（zod）
2. `apps/api/src/services/aliasRecommendation.ts`（推奨）
3. `apps/api/src/workflows/backfillResponseFields.ts`（back-fill batch）
4. `apps/api/src/workflows/schemaAliasAssign.ts`（workflow 本体）
5. `apps/api/src/routes/admin/schemaDiff.ts`（Hono handler、GET /diff + POST /aliases）

### ステップ 2: zod schema

```ts
// apps/api/src/schemas/schemaAliasAssign.ts
import { z } from 'zod'
export const SchemaAliasAssignBody = z.object({
  questionId: z.string().min(1),
  stableKey: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  dryRun: z.boolean().default(false),
})
export type SchemaAliasAssignBody = z.infer<typeof SchemaAliasAssignBody>
```

### ステップ 3: workflow 本体

```ts
// apps/api/src/workflows/schemaAliasAssign.ts
export async function schemaAliasAssign(env: Env, input: AliasAssignInput) {
  const question = await schemaQuestionsRepo.findById(env.DB, input.questionId)
  if (!question) throw new NotFoundError('question not found')

  const queue = await schemaDiffQueueRepo.findByQuestionId(env.DB, input.questionId)
  if (!queue) throw new NotFoundError('queue not found')

  // idempotent check
  if (queue.status === 'assigned' && question.stableKey === input.stableKey) {
    const affected = await responseFieldsRepo.countByQuestionId(env.DB, input.questionId, { excludeDeleted: true })
    return { mode: 'apply' as const, questionId: input.questionId, oldStableKey: question.stableKey, newStableKey: input.stableKey, affectedResponseFields: affected, queueStatus: 'assigned' }
  }
  // unidirectional
  if (queue.status === 'assigned' && question.stableKey !== input.stableKey) {
    throw new ConflictError('queue already assigned with different stableKey')
  }

  // collision pre-check (二次防御、UX のため)
  const conflictCount = await schemaQuestionsRepo.countByStableKeyAndVersion(env.DB, input.stableKey, question.schemaVersionId, { excludeQuestionId: input.questionId })
  const conflictExists = conflictCount > 0
  const affectedResponseFields = await responseFieldsRepo.countByQuestionId(env.DB, input.questionId, { excludeDeleted: true })

  if (input.dryRun) {
    return { mode: 'dryRun' as const, questionId: input.questionId, currentStableKey: question.stableKey, proposedStableKey: input.stableKey, affectedResponseFields, conflictExists }
  }

  // apply mode
  if (conflictExists) {
    throw new UnprocessableError(`stableKey '${input.stableKey}' already used in schema_version ${question.schemaVersionId}`)
  }

  const now = new Date().toISOString()
  const oldStableKey = question.stableKey

  // tx (D1 batch)
  const stmts = []
  stmts.push(env.DB.prepare(`UPDATE schema_questions SET stableKey=? WHERE id=? AND schemaVersionId=?`).bind(input.stableKey, input.questionId, question.schemaVersionId))
  stmts.push(env.DB.prepare(`UPDATE schema_diff_queue SET status='assigned', resolved_at=?, resolved_by=? WHERE id=? AND status='unresolved'`).bind(now, input.actorUserId, queue.id))
  await env.DB.batch(stmts)

  // back-fill (loop, 100 行/batch)
  const backfilledCount = await backfillResponseFields(env, { questionId: input.questionId, newStableKey: input.stableKey, batchSize: 100 })

  // audit (apply のみ)
  await env.DB.prepare(`INSERT INTO audit_log (id, actor_user_id, action, target_type, target_id, payload, occurred_at) VALUES (?,?,?,?,?,?,?)`).bind(
    crypto.randomUUID(), input.actorUserId, 'schema_diff.alias_assigned', 'schema_questions', input.questionId,
    JSON.stringify({ oldStableKey, newStableKey: input.stableKey, schemaVersionId: question.schemaVersionId, affectedResponseFields: backfilledCount, queueId: queue.id }),
    now
  ).run()

  return { mode: 'apply' as const, questionId: input.questionId, oldStableKey, newStableKey: input.stableKey, affectedResponseFields: backfilledCount, queueStatus: 'assigned' }
}
```

### ステップ 4: alias 推奨

```ts
// apps/api/src/services/aliasRecommendation.ts
function levenshtein(a: string, b: string): number { /* 標準アルゴリズム */ }

export function recommendAliases(
  diff: { sectionIndex: number; questionIndex: number; questionTitle: string },
  existing: Array<{ stableKey: string; sectionIndex: number; questionIndex: number; questionTitle: string }>
): string[] {
  const scored = existing.map((e) => ({
    stableKey: e.stableKey,
    score: -levenshtein(diff.questionTitle, e.questionTitle)
      + (e.sectionIndex === diff.sectionIndex ? 10 : 0)
      + (e.questionIndex === diff.questionIndex ? 5 : 0),
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, 5).map((s) => s.stableKey)
}
```

### ステップ 5: back-fill batch

```ts
// apps/api/src/workflows/backfillResponseFields.ts
export async function backfillResponseFields(env: Env, input: { questionId: string; newStableKey: string; batchSize: number }): Promise<number> {
  let total = 0
  let cpuStart = Date.now()
  const cpuReserve = Number(env.SCHEMA_BACKFILL_CPU_RESERVE_MS ?? 5000)
  const totalBudget = 30000 // Workers limit

  while (true) {
    if (Date.now() - cpuStart > totalBudget - cpuReserve) {
      throw new RetryableError('cpu budget exhausted, retry alias_assign to resume')
    }
    const result = await env.DB.prepare(
      `UPDATE response_fields SET stableKey=? WHERE questionId=? AND is_deleted=false AND (stableKey IS NULL OR stableKey != ?) LIMIT ?`
    ).bind(input.newStableKey, input.questionId, input.newStableKey, input.batchSize).run()
    const changed = result.meta.changes ?? 0
    total += changed
    if (changed < input.batchSize) break // 完了
  }
  return total
}
```

### ステップ 6: endpoint handler

```ts
// apps/api/src/routes/admin/schemaDiff.ts
import { Hono } from 'hono'
import { SchemaAliasAssignBody } from '@/schemas/schemaAliasAssign'
import { schemaAliasAssign } from '@/workflows/schemaAliasAssign'
import { recommendAliases } from '@/services/aliasRecommendation'
import { adminGate } from '@/middleware/adminGate'

export const schemaDiffRoutes = new Hono<{ Bindings: Env }>()
schemaDiffRoutes.use('*', adminGate)

schemaDiffRoutes.get('/diff', async (c) => {
  const diffs = await schemaDiffQueueRepo.listUnresolved(c.env.DB)
  const existing = await schemaQuestionsRepo.listAll(c.env.DB)
  const enriched = diffs.map((d) => ({ ...d, recommendedStableKeys: recommendAliases(d, existing) }))
  return c.json({ diffs: enriched })
})

schemaDiffRoutes.post('/aliases', async (c) => {
  const dryRun = c.req.query('dryRun') === 'true'
  const body = SchemaAliasAssignBody.parse({ ...await c.req.json(), dryRun })
  const session = c.get('session')
  const result = await schemaAliasAssign(c.env, { ...body, actorUserId: session.userId })
  return c.json(result, 200)
})
```

### ステップ 7: sanity check

```bash
pnpm -F apps/api typecheck
pnpm -F apps/api lint
pnpm -F apps/api test workflows/schemaAliasAssign
pnpm -F apps/api test services/aliasRecommendation
pnpm -F apps/api test workflows/backfillResponseFields
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 各エラーパスを異常系へ |
| Phase 7 | AC trace |
| Phase 8 | DRY 化対象（共通 audit log helper） |

## 多角的チェック観点

| 不変条件 | runbook 担保 | 確認 |
| --- | --- | --- |
| #1 | コードに stableKey 文字列を固定しない（schema_questions row 経由） | grep test |
| #5 | workflow が apps/api 内、import boundary 守る | code review |
| #14 | UPDATE schema_questions が schemaAliasAssign 経由のみ | grep |
| 認可 | adminGate middleware を route に適用 | code review |
| audit | apply のみ INSERT、dryRun は無記録 | unit test |
| atomic | D1 batch で stmts 同時実行、back-fill は別途 idempotent | unit test |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 作成順 runbook | 5 | pending | 5 ファイル |
| 2 | zod schema | 5 | pending | regex stableKey |
| 3 | workflow 本体 | 5 | pending | apply / dryRun union |
| 4 | 推奨 | 5 | pending | Levenshtein |
| 5 | back-fill | 5 | pending | batch loop |
| 6 | handler | 5 | pending | Hono GET + POST |
| 7 | sanity check | 5 | pending | 5 コマンド |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | サマリー |
| ドキュメント | outputs/phase-05/schema-alias-implementation-runbook.md | 全擬似コード |
| メタ | artifacts.json | Phase 5 を completed |

## 完了条件

- [ ] 5 ファイルの作成順
- [ ] workflow / 推奨 / back-fill / handler の擬似コード完成
- [ ] sanity check 手順
- [ ] 不変条件 #1, #14 に対する code 上の担保

## タスク100%実行確認

- 全擬似コードが対応 path
- artifacts.json で phase 5 を completed

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ: 各 throw を異常系 case へ
- ブロック条件: 擬似コード未完なら次へ進めない
