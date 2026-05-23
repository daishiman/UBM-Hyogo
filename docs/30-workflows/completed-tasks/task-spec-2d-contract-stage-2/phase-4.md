# Phase 4: テスト作成（TDD Red）

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 4 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. describe / test 構造表

| # | describe | test 名 | schema source | 主 assertion |
|---|---------|---------|---------------|-------------|
| 1 | `GET /admin/requests` | query schema が UI fixture を parse できる | `ListRequestsQueryZ` | `parse({ status:'pending', type:'visibility_request' })` not throw |
| 1 | 同上 | response items[] shape が UI fixture と同型 | type-level | `expectTypeOf<typeof adminRequestItem>().toMatchTypeOf<{ noteId:string; memberId:string; status:'pending'\|'resolved'\|'rejected'; type:'visibility_request'\|'delete_request'; createdAt:string }>()` |
| 2 | `POST /admin/requests/:noteId/resolve` | approve body parse | `adminRequestResolveBodySchema` | `parse({ resolution:'approve' })` not throw |
| 2 | 同上 | reject + note body parse | 同上 | `parse({ resolution:'reject', resolutionNote:'duplicate' })` not throw |
| 2 | 同上 | 失敗系: 不正 resolution は throw | 同上 | `parse({ resolution:'unknown' })` throws |
| 3 | `GET /admin/identity-conflicts` | items[] が IdentityConflictRowZ と同型 | `IdentityConflictRowZ` | `parse(identityConflictItem)` not throw |
| 3 | 同上 | list response 全体が ListIdentityConflictsResponseZ と同型 | `ListIdentityConflictsResponseZ` | parse not throw |
| 4 | `POST /admin/identity-conflicts/:id/merge` | request body parse | `MergeIdentityRequestZ` | `parse({ targetMemberId:'m_001', reason:'同一人物確定' })` not throw |
| 4 | 同上 | 失敗系: reason 空は throw | 同上 | `parse({ targetMemberId:'m_001', reason:'' })` throws |
| 4 | 同上 | response body parse | `MergeIdentityResponseZ` | `parse({ mergedAt, targetMemberId, archivedSourceMemberId, auditId })` not throw |
| 5 | `POST /admin/identity-conflicts/:id/dismiss` | request body parse | `DismissIdentityConflictRequestZ` | `parse({ reason:'別人と判明' })` not throw |
| 5 | 同上 | 失敗系: reason 空は throw | 同上 | parse throws |
| 5 | 同上 | response body parse | `DismissIdentityConflictResponseZ` | `parse({ dismissedAt })` not throw |
| 6 | `POST /admin/members/:memberId/delete` | request body parse | `DeleteBodyZ` | `parse({ reason:'退会希望' })` not throw |
| 6 | 同上 | 失敗系: reason 空は throw | 同上 | parse throws（min(1) 違反） |
| 6 | 同上 | 失敗系: reason 欠落は throw | 同上 | parse throws |
| 6 | 同上 | 失敗系: reason 501 文字は throw | 同上 | parse throws（max(500) 違反） |
| 6 | 同上 | response shape が UI fixture と同型 | type-level | `expectTypeOf<typeof memberDeleteResponse>().toMatchTypeOf<{ id:string; isDeleted:true; deletedAt:string }>()` |
| 7 | `GET /admin/audit` | query schema が UI fixture を parse できる | `ListAuditQueryZ` | `parse({ action:'admin.member.deleted', limit:50 })` not throw |
| 7 | 同上 | 失敗系: actorEmail が email 形式でない場合 throw | 同上 | `parse({ actorEmail:'not-email' })` throws |
| 7 | 同上 | audit entry 同型（type-level） | type-level | `expectTypeOf<typeof auditEntry>().toMatchTypeOf<...>()` |

---

## 2. 期待される失敗状態（TDD Red）

| 段階 | 失敗内容 | 期待エラー |
|------|---------|-----------|
| 1. ファイル新規作成直後 | route の `DeleteBodyZ` / `ListRequestsQueryZ` / `ListAuditQueryZ` が export されていない | TypeScript: `has no exported member 'DeleteBodyZ'` 等 |
| 2. named export 化前に typecheck 実行 | 同上 | tsc exit 非 0 |
| 3. shape 不整合が残っていた場合 | `MergeIdentityResponseZ.parse(mergeResponseBody)` が `archivedSourceMemberId` 欠落で throw | ZodError |

---

## 3. skip 0 / `z.object(` 0 の事前 grep

| command | 期待 |
|---------|------|
| `grep -E '\\b(test\|it\|describe)\\.skip' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 0 件 |
| `grep -E 'z\\.object\\(' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 0 件 |

---

## 4. Red 確認後の遷移

3 route ファイルの named export 化（Phase 5）を行う前に、test ファイルだけ作成して typecheck を流すと export 欠落で fail する。これを Red 状態として確認し、Phase 5 で Green に転じる。

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| TDD state | Red |

## 目的

export 欠落と schema drift を先に Red として観測し、Phase 5 の最小実装で Green に転じる検証構造を固定する。

## 実行タスク

1. `contract-stage-2.test.ts` の 7 describe 構造を作る。
2. route named export 未追加状態で typecheck Red を確認する。
3. `z.object` grep と skip grep を別 gate として記録する。
4. Red evidence を Phase 11 の tracked `.txt` evidence へ転記できる形にする。

## 参照資料

- `phase-2.md` import / re-export map
- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`
- `apps/api/src/routes/admin/{requests,audit,member-delete}.ts`

## 成果物

- TDD Red 用 test structure
- Red 期待エラー表
- grep gate command

## 完了条件

- [x] 7 describe / runtime parse / type-level assertion の構造が揃っている
- [x] Red の期待失敗が export 欠落または shape drift に限定されている
- [x] `z.object` grep と skip grep が分離されている
- [x] タスク100%実行確認: Phase 4 の実行タスクをすべて完了してから Phase 5 へ進む

## 統合テスト連携

Phase 4 の Red は `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` で観測する。実装前の Red なので Phase 11 PASS evidence には使わず、Red→Green の差分説明にのみ使う。
