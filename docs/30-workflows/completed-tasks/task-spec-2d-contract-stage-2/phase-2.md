# Phase 2: 設計

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 2 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. アーキテクチャ概要

```
[2a/2b/2c Playwright spec] -- page.route() returns --> [UI fixture object (inline literal)]
                                                              |
                                                              | same shape
                                                              v
[2d contract test]  --- import schema ---> [zod schema (route or shared)]
                    `--- parse(fixture) ---> not throw / throws as expected
```

- 2d test は pure unit。DB / Network / FS / Cloudflare binding を一切触らない。
- fixture object は 2d test 内 inline で `as const` 定義。
- 別ファイル化（`fixtures/admin-stage-2.ts`）は Phase 8 リファクタの責務外として **本 Stage では行わない**。

---

## 2. モジュール構造

| layer | 構成要素 |
|-------|---------|
| 新規 test | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| route (existing) | `apps/api/src/routes/admin/{requests,audit,member-delete,identity-conflicts}.ts` |
| shared schema | `packages/shared/src/schemas/identity-conflict.ts` 他 barrel |

---

## 3. import / re-export マップ

| symbol | 実体所在 | 2d test 側 import |
|--------|---------|------------------|
| `MergeIdentityRequestZ` | `packages/shared/src/schemas/identity-conflict.ts` | `import { MergeIdentityRequestZ } from '@ubm-hyogo/shared'` |
| `DismissIdentityConflictRequestZ` | 同上 | 同 barrel |
| `MergeIdentityResponseZ` | 同上 | 同 barrel |
| `DismissIdentityConflictResponseZ` | 同上 | 同 barrel |
| `IdentityConflictRowZ` / `ListIdentityConflictsResponseZ` | 同上 | 同 barrel |
| `adminRequestResolveBodySchema` | `@ubm-hyogo/shared` barrel | 同 barrel |
| `ListRequestsQueryZ` | `apps/api/src/routes/admin/requests.ts`（本 PR named export 化） | `import { ListRequestsQueryZ } from '../requests'` |
| `ListAuditQueryZ` | `apps/api/src/routes/admin/audit.ts`（本 PR named export 化） | `import { ListAuditQueryZ } from '../audit'` |
| `DeleteBodyZ` | `apps/api/src/routes/admin/member-delete.ts`（本 PR `export` 付与） | `import { DeleteBodyZ } from '../member-delete'` |

---

## 4. fixture object 標準形

| 名前 | shape | 用途 |
|------|-------|------|
| `adminRequestItem` | `{ noteId: string; memberId: string; status: 'pending'; type: 'visibility_request' \| 'delete_request'; createdAt: string }` | GET requests items[] |
| `requestResolveApproveBody` | `{ resolution: 'approve' }` | resolve body |
| `requestResolveRejectBody` | `{ resolution: 'reject'; resolutionNote: string }` | resolve body |
| `identityConflictItem` | `IdentityConflictRowZ` 同型 | identity-conflicts items[] |
| `mergeRequestBody` | `{ targetMemberId; reason }` | merge request |
| `mergeResponseBody` | `{ mergedAt; targetMemberId; archivedSourceMemberId; auditId }` | merge response（shared 正本） |
| `dismissRequestBody` | `{ reason }` | dismiss request |
| `dismissResponseBody` | `{ dismissedAt }` | dismiss response |
| `memberDeleteBody` | `{ reason: string }` | delete request |
| `memberDeleteResponse` | `{ id; isDeleted: true; deletedAt }` | delete response |
| `auditEntry` | `{ auditId; actorId; action: 'admin.member.deleted'; targetId; createdAt }` | audit items[] |

> **正本補正**: `mergeResponseBody` は shared `MergeIdentityResponseZ`（`archivedSourceMemberId` + `auditId` 含む）に整合させる。2a/2b/2c 仕様書側にもこの整合を Phase 12 で通知する。

---

## 5. 検証戦略

| 軸 | 方針 |
|----|------|
| runtime parse | `schema.parse(fixture)` を `expect(() => ...).not.toThrow()` でラップ |
| type-level | response shape の zod 未エクスポート部は `expectTypeOf<typeof fixture>().toMatchTypeOf<...>()` |
| 失敗系 | reason 空 / 501 文字 / 不正 resolution / actorEmail 非 email を throw 確認 |
| skip | 0 件（不変条件 #7） |
| timeout | default（5s）。pure unit のため十分 |

---

## 6. 副作用

| 項目 | 値 |
|------|-----|
| 入力 | なし（stdin/argv/env 一切参照しない） |
| 出力 | Vitest reporter への pass/fail のみ |
| 副作用 | なし（DB / Network / FS / binding 触れない） |
| Cloudflare binding | 不要（mock すらしない） |

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| design owner | `apps/api` contract test |

## 目的

7 endpoint の query / request body / response shape を route/shared schema import に対応させ、2d test 内で schema を再定義しない設計に固定する。

## 実行タスク

1. 7 endpoint inventory と schema source を照合する。
2. `DeleteBodyZ` / `ListRequestsQueryZ` / `ListAuditQueryZ` の named export 方針を固定する。
3. 2b fixture と `IdentityConflictRowZ` / `MergeIdentityResponseZ` の shared schema 正本を照合する。
4. runtime parse と type-level assertion の保証範囲を分離する。

## 参照資料

- `packages/shared/src/schemas/identity-conflict.ts`
- `packages/shared/src/index.ts`
- `apps/api/src/audit-correlation/__tests__/contract.test.ts`
- `apps/api/src/routes/admin/{requests,audit,member-delete,identity-conflicts}.ts`

## 成果物

- import / re-export map
- fixture object 標準形
- 副作用なしの pure unit 設計

## 完了条件

- [x] 7 endpoint と schema source が 1:1 で対応している
- [x] 2d test 内 `z.object(` 0 件の設計になっている
- [x] 2a/2b/2c fixture との同期点が Phase 12 へ渡されている
- [x] タスク100%実行確認: Phase 2 の実行タスクをすべて完了してから Phase 3 へ進む

## 統合テスト連携

Phase 5 の focused Vitest が本設計を実行する。`schema.parse(fixture)` は runtime contract、`expectTypeOf` は zod response export がない箇所の type-level contract として扱い、両者を混同しない。
