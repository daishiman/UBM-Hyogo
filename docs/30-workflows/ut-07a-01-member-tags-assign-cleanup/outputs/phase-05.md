# Phase 5 — 実装手順（diff 単位の指示）

実行者は次の順序で Edit を行うこと。

## Step 1: ファイル冒頭コメント置換

ツール: `Edit`
ファイル: `apps/api/src/repository/memberTags.ts`

`old_string` (L1-2 の 2 行)、`new_string`（Phase 4 文面 A）で置換する。

## Step 2: `assignTagsToMember` 関数定義 JSDoc 追加

ツール: `Edit`
ファイル: `apps/api/src/repository/memberTags.ts`

`old_string`:

```
export async function assignTagsToMember(
  c: DbCtx,
```

`new_string`: Phase 4 文面 B（JSDoc + `export async function assignTagsToMember(\n  c: DbCtx,` まで）

## Step 3: `MemberTagsProvider` interface 内 JSDoc 追加

ツール: `Edit`
ファイル: `apps/api/src/repository/memberTags.ts`

`old_string`:

```
  assignTagsToMember(mid: MemberId, tagIds: TagId[], assignedBy: string): Promise<number>;
```

`new_string`: Phase 4 文面 C

## Step 4: 検証コマンド逐次実行

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- tagQueue
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.readonly
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.repository
rg "assignTagsToMember" apps/api/src packages/shared/src
rg "tagQueueResolve workflow" apps/api/src/repository/memberTags.ts
```

全コマンド exit 0 / Phase 2 期待値と一致すること。

## ローカルブランチ運用

- 新規ブランチ名: `fix/ut-07a-01-member-tags-cleanup`
- base: `dev`
- コミットは Phase 13 で行う（本 Phase 内ではコミットしない）

## DoD（Phase 5）

- 上記 4 step 完了
- `git diff apps/api/src/repository/memberTags.ts apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts apps/api/src/repository/__tests__/memberTags.repository.spec.ts` で JSDoc 3 箇所と focused boundary tests のみが diff として現れる
- 関数 body / interface 引数型 / `createMemberTagsProvider` 実装に diff なし
