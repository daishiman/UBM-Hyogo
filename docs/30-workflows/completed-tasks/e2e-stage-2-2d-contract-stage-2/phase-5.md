# Phase 5: 実装（TDD Green）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |
| Implementation Mode | `new` |

## 1. 新規/修正ファイル一覧

| # | path | 種別 | 状態 | 行数目安 |
|---|------|------|------|---------|
| 1 | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | Vitest contract test | **新規** | 251 |
| 2 | `apps/api/src/routes/admin/member-delete.ts` | route 修正 | **既存・微修正** | +1 字句（`const DeleteBodyZ` → `export const DeleteBodyZ`） |
| 3 | `apps/api/src/routes/admin/requests.ts` | route 修正 | **既存・微修正** | +1 行（末尾に `export { ListQueryZ as ListRequestsQueryZ }` を追加。または `const ListQueryZ` の `export` 付与 + 別名 re-export） |
| 4 | `apps/api/src/routes/admin/audit.ts` | route 修正 | **既存・微修正** | +1 行（同上、`QueryZ` を `ListAuditQueryZ` として再 export） |
| 5 | `apps/api/src/routes/admin/identity-conflicts.ts` | 既存・修正なし | **変更なし** | 0（shared schema をそのまま import するため） |

> **不変条件再掲**: route 内部の識別子（`DeleteBodyZ` / `ListQueryZ` / `QueryZ`）は名称を変更しない。`export` 付与または別名 re-export のみ。route の内部参照は不変。

## 2. ファイル骨格（Green 状態の最終形）

```ts
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  MergeIdentityRequestZ,
  MergeIdentityResponseZ,
  DismissIdentityConflictRequestZ,
  DismissIdentityConflictResponseZ,
  IdentityConflictRowZ,
  ListIdentityConflictsResponseZ,
  adminRequestResolveBodySchema,
} from '@ubm-hyogo/shared'
import { DeleteBodyZ } from '../member-delete'
import { ListRequestsQueryZ } from '../requests'
import { ListAuditQueryZ } from '../audit'

// === fixtures（2a/2b/2c の page.route() fixture と同型を `as const` で固定） ===
const adminRequestItem = {
  noteId: 'note_001',
  memberId: 'mem_001',
  status: 'pending',
  type: 'visibility_request',
  createdAt: '2026-05-09T00:00:00Z',
} as const

const requestResolveApproveBody = { resolution: 'approve' } as const
const requestResolveRejectBody = { resolution: 'reject', resolutionNote: 'duplicate' } as const

const identityConflictItem = {
  conflictId: 'm_source__m_target',
  sourceMemberId: 'mem_001',
  candidateTargetMemberId: 'mem_002',
  matchedFields: ['responseEmail'],
  detectedAt: '2026-05-09T00:00:00Z',
  responseEmailMasked: 'a***@example.com',
  syncJobId: 'sync_001',
} as const

const mergeRequestBody = { targetMemberId: 'mem_002', reason: '同一人物確定' } as const
const mergeResponseBody = {
  mergedAt: '2026-05-09T00:00:00Z',
  targetMemberId: 'mem_002',
  archivedSourceMemberId: 'mem_001',
  auditId: 'aud_001',
} as const

const dismissRequestBody = { reason: '別人と判明' } as const
const dismissResponseBody = { dismissedAt: '2026-05-09T00:00:00Z' } as const

const memberDeleteBody = { reason: '退会希望' } as const
const memberDeleteResponse = {
  id: 'mem_001',
  isDeleted: true as const,
  deletedAt: '2026-05-09T00:00:00Z',
} as const

const auditEntry = {
  auditId: 'aud_001',
  actorId: 'admin_001',
  action: 'admin.member.deleted',
  targetId: 'mem_001',
  createdAt: '2026-05-09T00:00:00Z',
} as const

// === 7 describe ブロック（phase-2 §5 の表に従う） ===
describe('GET /admin/requests', () => { /* 2 it */ })
describe('POST /admin/requests/:noteId/resolve', () => { /* 3 it */ })
describe('GET /admin/identity-conflicts', () => { /* 2 it */ })
describe('POST /admin/identity-conflicts/:id/merge', () => { /* 3 it */ })
describe('POST /admin/identity-conflicts/:id/dismiss', () => { /* 3 it */ })
describe('POST /admin/members/:memberId/delete', () => { /* 5 it */ })
describe('GET /admin/audit', () => { /* 3 it */ })
```

## 3. 関数シグネチャ

| 名前 | shape | 副作用 |
|------|-------|--------|
| なし（helper 関数なし） | — | — |

> 本 spec は inline `parse()` / `expectTypeOf` のみで構成し、helper 抽出は行わない（Phase 6 リファクタ判断にて「inline で完結」を選択）。

## 4. 入出力

| 項目 | 内容 |
|------|------|
| 入力 | なし（pure unit、stdin / argv / env / FS / network / D1 / KV / R2 一切参照しない） |
| 出力 | Vitest reporter への pass/fail 通知のみ |
| 副作用 | なし |
| ランタイム依存 | `vitest`、`zod`、`@ubm-hyogo/shared`、`apps/api/src/routes/admin/{requests,audit,member-delete}.ts` |
| Cloudflare binding | 不要（mock すらしない） |

## 5. 実装手順

1. `apps/api/src/routes/admin/member-delete.ts:10` の `const DeleteBodyZ` を `export const DeleteBodyZ` に変更（1 字句追加）。
2. `apps/api/src/routes/admin/requests.ts` 末尾に `export { ListQueryZ as ListRequestsQueryZ }` を追加（または `const ListQueryZ` を `export const` に変えた上で同末尾に別名 re-export）。
3. `apps/api/src/routes/admin/audit.ts` 末尾に `export { QueryZ as ListAuditQueryZ }` を追加（同上）。
4. `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` を新規作成。冒頭に import と fixture 定数を配置（§2 骨格参照）。
5. 7 describe を phase-2 §5 の表に従って実装。各 it は `parse()` の `not.toThrow()` / `toThrow()` または `expectTypeOf` で構成。
6. `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` で全 pass / skip 0 を確認。
7. `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` / `mise exec -- pnpm --filter @ubm-hyogo/api lint` を pass。
8. grep gate を確認（`z.object(` = 0 / `test.skip` = 0 / `apps/web` import = 0）。

## 6. 受け入れ基準（Green 化）

| # | 基準 |
|---|------|
| G1 | 7 describe ブロックすべて green |
| G2 | skip = 0 |
| G3 | `@ubm-hyogo/api` typecheck / lint exit 0 |
| G4 | 行数 251（`wc -l` で確認） |
| G5 | `z.object(` count = 0 |
| G6 | `apps/web` import count = 0 |
| G7 | route 3 ファイルの diff が各 +1 字句〜+1 行に収まる |
