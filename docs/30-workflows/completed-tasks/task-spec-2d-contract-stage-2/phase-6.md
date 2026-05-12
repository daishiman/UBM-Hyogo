# Phase 6: テスト拡充

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 6 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. 失敗系拡充項目

| # | 対象 schema | ケース | 期待 |
|---|------------|--------|------|
| 1 | `DeleteBodyZ` | `parse({ reason:'' })` | throws（min(1) 違反） |
| 2 | `DeleteBodyZ` | `parse({})` | throws（reason 必須） |
| 3 | `DeleteBodyZ` | `parse({ reason: 'a'.repeat(501) })` | throws（max(500) 違反） |
| 4 | `MergeIdentityRequestZ` | `parse({ targetMemberId:'m_001', reason:'' })` | throws |
| 5 | `DismissIdentityConflictRequestZ` | `parse({ reason:'' })` | throws |
| 6 | `adminRequestResolveBodySchema` | `parse({ resolution:'unknown' })` | throws |
| 7 | `ListAuditQueryZ` | `parse({ actorEmail:'not-email' })` | throws（email format 違反） |

---

## 2. 成功系 boundary

| # | schema | ケース | 期待 |
|---|--------|--------|------|
| 1 | `DeleteBodyZ` | `parse({ reason: 'a' })` | not throw（min 境界） |
| 2 | `DeleteBodyZ` | `parse({ reason: 'a'.repeat(500) })` | not throw（max 境界） |
| 3 | `ListAuditQueryZ` | `parse({ action:'admin.member.deleted', limit:50 })` | not throw |
| 4 | `adminRequestResolveBodySchema` | `parse({ resolution:'reject', resolutionNote:'duplicate' })` | not throw |

---

## 3. type-level 拡充

| # | fixture | 想定型 |
|---|---------|--------|
| 1 | `adminRequestItem` | `{ noteId:string; memberId:string; status:'pending'\|'resolved'\|'rejected'; type:'visibility_request'\|'delete_request'; createdAt:string }` |
| 2 | `memberDeleteResponse` | `{ id:string; isDeleted:true; deletedAt:string }` |
| 3 | `auditEntry` | `{ auditId:string; actorId:string; action:'admin.member.deleted'; targetId:string; createdAt:string }` |

---

## 4. 不変条件 再確認

| # | 条件 | 結果 |
|---|------|------|
| 1 | `z.object(` 0 件（CONST_007） | 維持 |
| 2 | skip 0 件 | 維持 |
| 3 | DB / Network / FS 副作用なし | 維持 |
| 4 | 行数 200-260 範囲内 | 確認 |

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| phase role | negative / boundary expansion |

## 目的

成功系だけでなく、空文字、欠落、長すぎる reason、不正 enum、不正 email を contract test に含め、schema drift を fail-fast にする。

## 実行タスク

1. request body の失敗系を追加する。
2. `DeleteBodyZ` の min / max 境界を確認する。
3. whitespace-only reason の扱いを実 schema に合わせて確認する。
4. type-level fixture の主要 shape を固定する。

## 参照資料

- `phase-4.md`
- `phase-5.md`
- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`

## 成果物

- 失敗系 test cases
- 成功系 boundary test cases
- type-level assertion

## 完了条件

- [x] 失敗系 7 件が test に入っている
- [x] 成功系 boundary が Green になっている
- [x] `it.todo` / `test.todo` / skip が 0 件
- [x] タスク100%実行確認: Phase 6 の実行タスクをすべて完了してから Phase 7 へ進む

## 統合テスト連携

Phase 6 の追加 assertion は Phase 11 の focused Vitest evidence に含める。`it.todo` / `test.todo` は残さず、必要な a11y / visual evidence は NON_VISUAL のため対象外とする。
