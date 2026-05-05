# Implementation Guide

## Part 1: 中学生レベル

なぜ必要か: 管理者が会員にタグを付けるとき、「付ける」のか「付けない」のかがあいまいだと、あとでどちらの判断だったか分からなくなります。

たとえば、会員さんに札を貼る係が「この札を貼ります」または「貼りません。理由はこれです」のどちらかを必ず書くようにしました。空の紙や、貼る話と断る話が混ざった紙は受け付けません。

何をするか: API に送る body を `confirmed + tagCodes` か `rejected + reason` のどちらか 1 つに固定します。

## Part 2: 技術者レベル

Canonical schema:

```ts
type TagQueueResolveBody =
  | { action: "confirmed"; tagCodes: string[] }
  | { action: "rejected"; reason: string };
```

Implemented files:

| Layer | File |
| --- | --- |
| shared schema | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` |
| API route | `apps/api/src/routes/admin/tags-queue.ts` |
| API compat alias | `apps/api/src/schemas/tagQueueResolve.ts` |
| web client | `apps/web/src/lib/admin/api.ts` |
| shared test | `packages/shared/src/schemas/admin/tag-queue-resolve.test.ts` |
| API route test | `apps/api/src/routes/admin/tags-queue.test.ts` |

API signature:

```ts
resolveTagQueue(queueId: string, body: TagQueueResolveBody)
```

Error behavior:

| Error | Status |
| --- | --- |
| schema validation | 400 `validation_error` |
| queue not found | 404 `queue_not_found` |
| conflict / reverse transition | 409 `state_conflict` |
| unknown tag | 422 `unknown_tag_code` |
| deleted member | 422 `member_deleted` |

Phase 11 evidence: `../phase-11/test-report.md` and `../phase-11/manual-evidence.md`.

