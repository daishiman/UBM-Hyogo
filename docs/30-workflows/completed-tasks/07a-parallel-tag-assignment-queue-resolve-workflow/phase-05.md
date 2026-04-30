# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07a-parallel-tag-assignment-queue-resolve-workflow |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

resolve workflow 本体と candidate 投入 hook の実装手順を runbook + 擬似コード化する。

## 実行タスク

1. ファイル作成順序
2. zod schema 擬似コード
3. tagQueueResolve workflow 擬似コード
4. enqueueTagCandidate hook 擬似コード
5. endpoint handler 擬似コード
6. sanity check

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/tag-queue-state-machine.md | 設計図 |
| 必須 | outputs/phase-04/tag-queue-test-strategy.md | assertion |

## 実行手順

### ステップ 1: 作成順
1. `apps/api/src/schemas/tagQueueResolve.ts`（zod）
2. `apps/api/src/workflows/tagQueueResolve.ts`（workflow 本体）
3. `apps/api/src/workflows/tagCandidateEnqueue.ts`（hook）
4. `apps/api/src/routes/admin/tagQueue.ts`（Hono handler）
5. 03b との接続: `apps/api/src/jobs/responseSync.ts` 末尾に hook 呼び出し

### ステップ 2: zod schema
```ts
// apps/api/src/schemas/tagQueueResolve.ts
import { z } from 'zod'
export const TagQueueResolveBody = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('confirmed'),
    tagCodes: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    action: z.literal('rejected'),
    reason: z.string().min(1),
  }),
])
export type TagQueueResolveBody = z.infer<typeof TagQueueResolveBody>
```

### ステップ 3: workflow 本体
```ts
// apps/api/src/workflows/tagQueueResolve.ts
export async function tagQueueResolve(env: Env, input: ResolveInput) {
  const queue = await tagQueueRepo.find(env.DB, input.queueId)
  if (!queue) throw new NotFoundError('queue not found')

  // idempotent check
  if (queue.status === input.action) {
    return { queueId: queue.id, status: queue.status, resolvedAt: queue.resolvedAt, memberId: queue.memberId, tagCodes: queue.tagCodes }
  }
  // unidirectional check
  if (queue.status !== 'candidate') {
    throw new ConflictError(`cannot transition from ${queue.status} to ${input.action}`)
  }

  // member status check (#15 の precaution)
  const member = await memberRepo.find(env.DB, queue.memberId)
  if (!member || member.isDeleted) throw new UnprocessableError('member deleted')

  if (input.action === 'confirmed') {
    // tag_definitions check
    const known = await tagDefinitionsRepo.findByCodes(env.DB, input.tagCodes)
    if (known.length !== input.tagCodes.length) throw new UnprocessableError('unknown tag code')
  }

  const now = new Date().toISOString()

  // guarded update: race lost 時は後続副作用を書かない
  const update = env.DB.prepare(`UPDATE tag_assignment_queue SET status='resolved', updated_at=? WHERE queue_id=? AND status IN ('queued','reviewing')`).bind(now, input.queueId)
  const updateResult = await update.run()
  if (updateResult.meta.changes === 0) {
    throw new ConflictError('queue state changed during resolve')
  }

  const followups = []
  if (input.action === 'confirmed') {
    for (const code of input.tagCodes!) {
      followups.push(env.DB.prepare(`INSERT INTO member_tags (...) VALUES (...) ON CONFLICT DO UPDATE ...`).bind(...))
    }
  } else {
    // rejected は UPDATE 文で reason を保存する
  }
  followups.push(env.DB.prepare(`INSERT INTO audit_log (...) VALUES (...)`).bind(...))
  for (const stmt of followups) {
    await stmt.run()
  }

  return { queueId: input.queueId, status: input.action, resolvedAt: now, memberId: queue.memberId, tagCodes: input.tagCodes }
}
```

### ステップ 4: candidate 投入 hook
```ts
// apps/api/src/workflows/tagCandidateEnqueue.ts
export async function enqueueTagCandidate(env: Env, input: { memberId: string; responseId: string }) {
  // skip if member already has tags or unresolved candidate
  const existingTags = await memberTagsRepo.countByMemberId(env.DB, input.memberId)
  if (existingTags > 0) return { enqueued: false, reason: 'has_tags' }

  const pendingCandidate = await tagQueueRepo.findPendingByMemberId(env.DB, input.memberId)
  if (pendingCandidate) return { enqueued: false, reason: 'has_pending_candidate' }

  const now = new Date().toISOString()
  await env.DB.prepare(`INSERT INTO tag_assignment_queue (id, member_id, response_id, status, created_at) VALUES (?,?,?,'candidate',?)`).bind(crypto.randomUUID(), input.memberId, input.responseId, now).run()
  return { enqueued: true }
}
```

### ステップ 5: endpoint handler
```ts
// apps/api/src/routes/admin/tagQueue.ts
import { Hono } from 'hono'
import { TagQueueResolveBody } from '@/schemas/tagQueueResolve'
import { tagQueueResolve } from '@/workflows/tagQueueResolve'
import { adminGate } from '@/middleware/adminGate'

export const tagQueueRoutes = new Hono<{ Bindings: Env }>()

tagQueueRoutes.use('*', adminGate)

tagQueueRoutes.post('/queue/:queueId/resolve', async (c) => {
  const queueId = c.req.param('queueId')
  const body = TagQueueResolveBody.parse(await c.req.json())
  const session = c.get('session')
  const result = await tagQueueResolve(c.env, { queueId, actorUserId: session.userId, ...body })
  return c.json(result, 200)
})
```

### ステップ 6: 03b との接続
```ts
// apps/api/src/jobs/responseSync.ts (03b で実装、本タスクで hook 呼び出しを追加)
for (const memberUpdate of newOrUpdatedResponses) {
  await enqueueTagCandidate(env, { memberId: memberUpdate.memberId, responseId: memberUpdate.responseId })
}
```

### ステップ 7: sanity check
```bash
pnpm -F apps/api typecheck
pnpm -F apps/api lint
pnpm -F apps/api test workflows/tagQueue
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 各エラーパスを異常系へ |
| Phase 7 | AC trace |
| Phase 8 | DRY 化対象 |

## 多角的チェック観点

| 不変条件 | runbook 担保 | 確認 |
| --- | --- | --- |
| #5 | workflow が apps/api 内、import boundary 守る | code review |
| #13 | member_tags INSERT が本 workflow のみ | grep |
| 認可 | adminGate middleware を route に適用 | code review |
| audit | guarded update 成功後に audit_log INSERT を必ず含める | unit test |
| atomic | guarded update で全 stmt 同時実行 | unit test |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 作成順 runbook | 5 | pending | 5 ファイル |
| 2 | zod schema | 5 | pending | discriminatedUnion |
| 3 | workflow 本体 | 5 | pending | guarded write |
| 4 | hook | 5 | pending | 03b 連携 |
| 5 | handler | 5 | pending | Hono |
| 6 | sanity check | 5 | pending | 3 コマンド |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | サマリー |
| ドキュメント | outputs/phase-05/tag-queue-implementation-runbook.md | 全擬似コード |
| メタ | artifacts.json | Phase 5 を completed |

## 完了条件

- [ ] 5 ファイルの作成順
- [ ] workflow / hook / handler の擬似コード完成
- [ ] sanity check 手順
- [ ] 不変条件 #5, #13 に対する code 上の担保

## タスク100%実行確認

- 全擬似コードが対応 path
- artifacts.json で phase 5 を completed

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ: 各 throw を異常系 case へ
- ブロック条件: 擬似コード未完なら次へ進めない
