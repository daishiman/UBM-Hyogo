# Phase 2: 設計

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. test ファイル構造

`apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` は Vitest を runtime とし、以下を import する:

```ts
import { describe, expect, it } from 'vitest'
import { expectTypeOf } from 'vitest'
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
```

7 describe ブロックを配置し、各 describe 内に 1〜5 件の `it(...)` を持つ。

## 2. import / re-export マップ

| symbol | 実体所在 | 取得経路 |
|--------|---------|---------|
| `MergeIdentityRequestZ` | `packages/shared/src/schemas/identity-conflict.ts:28` | `@ubm-hyogo/shared` barrel |
| `MergeIdentityResponseZ` | 同上 :34（shape: `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }`） | 同上 |
| `DismissIdentityConflictRequestZ` | 同上 :42 | 同上 |
| `DismissIdentityConflictResponseZ` | 同上 :47 | 同上 |
| `IdentityConflictRowZ` | 同上 :11 | 同上 |
| `ListIdentityConflictsResponseZ` | 同上 :22 | 同上 |
| `adminRequestResolveBodySchema` | `packages/shared` 既存 export | 同上 |
| `DeleteBodyZ` | `apps/api/src/routes/admin/member-delete.ts:10`（本 PR で `export` 付与） | 相対 import `../member-delete` |
| `ListRequestsQueryZ` | `apps/api/src/routes/admin/requests.ts`（本 PR で named export 化、`ListQueryZ` 別名 export） | 相対 import `../requests` |
| `ListAuditQueryZ` | `apps/api/src/routes/admin/audit.ts`（本 PR で named export 化、`QueryZ` 別名 export） | 相対 import `../audit` |

## 3. fixture object 標準形（元仕様 §5 完全準拠）

| 名前 | shape | 用途 |
|------|-------|------|
| `adminRequestItem` | `{ noteId: string, memberId: string, status: 'pending', type: 'visibility_request' \| 'delete_request', createdAt: string }` | `GET /admin/requests` items[] type-level |
| `requestResolveApproveBody` | `{ resolution: 'approve' }` | `POST /admin/requests/:noteId/resolve` body |
| `requestResolveRejectBody` | `{ resolution: 'reject', resolutionNote: string }` | 同上 |
| `identityConflictItem` | `IdentityConflictRowZ` 同型（`{ conflictId, sourceMemberId, candidateTargetMemberId, matchedFields, detectedAt, responseEmailMasked, syncJobId }`） | `GET /admin/identity-conflicts` items[] |
| `mergeRequestBody` | `{ targetMemberId: string, reason: string }` | merge request |
| `mergeResponseBody` | `{ mergedAt: string, targetMemberId: string, archivedSourceMemberId: string, auditId: string }` | merge response（**shared 正本準拠**） |
| `dismissRequestBody` | `{ reason: string }` | dismiss request |
| `dismissResponseBody` | `{ dismissedAt: string }` | dismiss response |
| `memberDeleteBody` | `{ reason: string }` | member delete request |
| `memberDeleteResponse` | `{ id: string, isDeleted: true, deletedAt: string }` | member delete response（type-level） |
| `auditEntry` | `{ auditId: string, actorId: string, action: 'admin.member.deleted', targetId: string, createdAt: string }` | audit items[] |

> **重要なズレ補正（元仕様 §13 A 起源）**: 親 workflow phase-4/5 が記載していた merge response `{ targetMemberId, sourceMemberId, mergedAt }` は誤りで、**shared schema が正本**。本 spec は `archivedSourceMemberId` + `auditId` を含む shape を fixture に固定する。

## 4. schema 解決戦略（CONST_007 重複禁止）

| 対象 | 解決経路 |
|------|---------|
| zod export 済 schema | shared / route から import し `parse()` を呼ぶ |
| zod 未 export な response shape | `expectTypeOf<typeof fixture>().toMatchTypeOf<...>()` による type-level 同型確認 |
| fixture object | 2d test 内 inline literal を `as const` で固定 |

`z.object(` を test ファイル内で**新規定義しない**。すべて import で解決する。

## 5. describe / test 構造表（7 ブロック）

| # | describe | it 名 | schema source | 主 assertion |
|---|---------|-------|--------------|-------------|
| 1 | `GET /admin/requests` | `query schema が UI fixture を parse できる` | `ListRequestsQueryZ` | `parse({ status:'pending', type:'visibility_request' })` not throw |
| 1 | 同上 | `response items[] shape が UI fixture と同型（type-level）` | type-level | `expectTypeOf<typeof adminRequestItem>().toMatchTypeOf<{ noteId:string; memberId:string; status:'pending' \| 'resolved' \| 'rejected'; type:'visibility_request' \| 'delete_request'; createdAt:string }>()` |
| 2 | `POST /admin/requests/:noteId/resolve` | `approve body parse` | `adminRequestResolveBodySchema` | `parse({ resolution:'approve' })` not throw |
| 2 | 同上 | `reject + note body parse` | 同上 | `parse({ resolution:'reject', resolutionNote:'duplicate' })` not throw |
| 2 | 同上 | `失敗系: 不正 resolution は throw` | 同上 | `parse({ resolution:'unknown' })` throws |
| 3 | `GET /admin/identity-conflicts` | `items[] が IdentityConflictRowZ と同型` | `IdentityConflictRowZ` | `parse(identityConflictItem)` not throw |
| 3 | 同上 | `list response 全体が ListIdentityConflictsResponseZ と同型` | `ListIdentityConflictsResponseZ` | parse not throw |
| 4 | `POST /admin/identity-conflicts/:id/merge` | `request body parse` | `MergeIdentityRequestZ` | `parse({ targetMemberId:'m_001', reason:'同一人物確定' })` not throw |
| 4 | 同上 | `失敗系: reason 空は throw` | 同上 | `parse({ targetMemberId:'m_001', reason:'' })` throws |
| 4 | 同上 | `response body parse（archivedSourceMemberId + auditId 含む）` | `MergeIdentityResponseZ` | `parse(mergeResponseBody)` not throw |
| 5 | `POST /admin/identity-conflicts/:id/dismiss` | `request body parse` | `DismissIdentityConflictRequestZ` | `parse({ reason:'別人と判明' })` not throw |
| 5 | 同上 | `失敗系: reason 空は throw` | 同上 | parse throws |
| 5 | 同上 | `response body parse` | `DismissIdentityConflictResponseZ` | `parse({ dismissedAt:'...' })` not throw |
| 6 | `POST /admin/members/:memberId/delete` | `request body parse` | `DeleteBodyZ` | `parse({ reason:'退会希望' })` not throw |
| 6 | 同上 | `失敗系: reason 空は throw` | 同上 | `parse({ reason:'' })` throws（min(1) 違反） |
| 6 | 同上 | `失敗系: reason 欠落は throw` | 同上 | `parse({})` throws |
| 6 | 同上 | `失敗系: reason 501 文字は throw` | 同上 | parse throws（max(500) 違反） |
| 6 | 同上 | `response shape が UI fixture と同型（type-level）` | type-level | `expectTypeOf<typeof memberDeleteResponse>().toMatchTypeOf<{ id:string; isDeleted:true; deletedAt:string }>()` |
| 7 | `GET /admin/audit` | `query schema が UI fixture を parse できる` | `ListAuditQueryZ` | `parse({ action:'admin.member.deleted', limit:50 })` not throw |
| 7 | 同上 | `失敗系: actorEmail が email 形式でない場合 throw` | 同上 | `parse({ actorEmail:'not-email' })` throws |
| 7 | 同上 | `audit entry が UI fixture と同型（type-level）` | type-level | `expectTypeOf<typeof auditEntry>().toMatchTypeOf<...>()` |

## 6. 状態語彙

contract test は pure unit のため、local Vitest pass = **canonical pass**（runtime / staging 区別なし）。`workflow_state = implemented_local_evidence_captured` を Phase 12 PASS で確定し、commit / push / PR は Phase 13 user gate に残す。
