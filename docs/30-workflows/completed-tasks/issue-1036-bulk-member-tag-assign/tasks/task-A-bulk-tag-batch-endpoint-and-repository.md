# task-A: bulk tag batch endpoint + repository + tag master read + audit + type gate

| 項目 | 内容 |
|------|------|
| 領域 | apps/api |
| 依存 | なし |
| AC | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6（API側） |
| 実装区分 | 実装仕様書 |

## 変更対象ファイル

| パス | 種別 | 内容 |
|------|------|------|
| `apps/api/src/repository/memberTags.ts` | 編集 | `bulkApplyMemberTagsByAdmin` + 型 export + #13 コメント追記 |
| `apps/api/src/routes/admin/members.ts` | 編集 | `POST /members/tags/bulk` 追加（`:memberId` 系より前に登録） |
| `apps/api/src/routes/admin/tags.ts` | 新規 or `members.ts` 内 | `GET /admin/tags`（tag master read） |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | 編集 | allow list に `bulkApplyMemberTagsByAdmin` を明示参照 |
| `apps/api/src/routes/admin/members-tags-bulk.contract.spec.ts` | 新規 | bulk endpoint contract test |
| `apps/api/src/repository/__tests__/memberTags.bulk.repository.spec.ts` | 新規 | repository helper unit test |

## 関数シグネチャ（確定）

```typescript
// memberTags.ts
export type BulkTagOp = "assign" | "unassign";
export type BulkTagItemStatus =
  | "assigned" | "unassigned" | "noop" | "skipped_deleted" | "tag_not_found";
export interface BulkTagOpResultItem {
  readonly memberId: string; readonly tagId: string; readonly status: BulkTagItemStatus;
}
export interface BulkApplyMemberTagsResult {
  readonly batchId: string;
  readonly results: ReadonlyArray<BulkTagOpResultItem>;
}
export async function bulkApplyMemberTagsByAdmin(
  c: DbCtx,
  input: { memberIds: MemberId[]; tagIds: string[]; op: BulkTagOp },
  actor: { id: AdminId | null; email: AdminEmail | null },
): Promise<BulkApplyMemberTagsResult>;
```

## 入力・出力・副作用

- 入力: memberIds（1..200）× tagIds（1..50）× op。
- 出力: `{ batchId, results: [{ memberId, tagId, status }] }`。
- 副作用: member_tags への INSERT OR IGNORE / DELETE、実 mutation した item ごとに audit_log へ 1 行 append。

## アルゴリズム（Phase 2 A-1 / Phase 3 D-1/D-3 確定版）

1. `batchId = crypto.randomUUID()`
2. tag master active set を `getTagDefinitionMaster` で取得 → `Set<tagId>`
3. member 存在 + is_deleted を memberIds で 1 クエリ一括取得（LEFT JOIN member_status）
4. memberId × tagId 直積 loop:
   - member 不在 or is_deleted=1 → `skipped_deleted`（tag 評価せず continue）
   - tagId ∉ active set → `tag_not_found`
   - assign: `INSERT OR IGNORE` → changes>0=`assigned`+audit / =0=`noop`
   - unassign: `DELETE … WHERE member_id AND tag_id` → changes>0=`unassigned`+audit / =0=`noop`
5. audit（実 mutation のみ）: action は `admin.member.tag_assigned`/`tag_unassigned`、targetType `"member"`、targetId memberId、assign は `after:{tagId,source:"manual",batchId}`、unassign は `before:{tagId,batchId}`
6. return `{ batchId, results }`

## DoD

- [ ] `bulkApplyMemberTagsByAdmin` 実装 + 型 export
- [ ] `POST /admin/members/tags/bulk` が 200 + results を返す（`:memberId` 誤マッチなし）
- [ ] `GET /admin/tags` が `{ available }` を返す
- [ ] type-level gate test green（`pnpm test -- --typecheck`）
- [ ] contract / repository test green
- [ ] `pnpm --filter @ubm-hyogo/api typecheck && pnpm lint` green
- [ ] 既存 `members.tags.contract.spec.ts` regression 無し
