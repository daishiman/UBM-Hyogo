# Phase 4 — 詳細設計（JSDoc 文面の正本）

## 文面 A: ファイル冒頭コメント置換

**対象**: `apps/api/src/repository/memberTags.ts` L1-2

**before**:

```ts
// member_tags + tag_definitions テーブルへの読み取り（read-only）
// 書き込み API は提供しない（不変条件: タグは rule/ai/manual で管理される）
```

**after**:

```ts
// member_tags + tag_definitions テーブルへの読み取り（read-only）。
// 書き込み API は新規追加禁止（不変条件 #13: タグ書き込みは tagQueueResolve workflow 経由のみ）。
// 例外として `assignTagsToMember` のみ 07a tagQueueResolve workflow 専用 helper として残置している。
// `assignTagsToMember` を tagQueueResolve workflow 以外の新規 caller から呼ぶことを禁止する。
// 直接 INSERT 経路を追加したい場合は不変条件 #13 のレビューを経ること。
```

## 文面 B: `assignTagsToMember` 関数定義 JSDoc

**対象**: `apps/api/src/repository/memberTags.ts` L63 直前

**before**:

```ts
export async function assignTagsToMember(
```

**after**:

```ts
/**
 * **tagQueueResolve workflow 専用 helper。直接呼び出し禁止。**
 *
 * 不変条件 #13（タグ書き込みは tagQueueResolve workflow 経由のみ）の例外として、
 * 07a で `apps/api/src/workflows/tagQueueResolve.ts` から `confirmed` 確定経路で呼ばれる helper。
 * これ以外の caller を追加することは禁止する。新規書き込み経路が必要な場合は、
 * `tagQueueResolve` workflow 側へ集約するか、不変条件 #13 自体の変更レビューを経ること。
 *
 * type-level の write keyword 禁止 gate（`memberTags.readonly.test-d.ts`）では
 * allow list として例外許可されている。新規 `insert*` / `update*` / `delete*` / `upsert*`
 * 接頭辞の export を追加すると type-level test が FAIL する。
 *
 * @internal tagQueueResolve workflow 以外からの呼び出しを禁止する
 */
export async function assignTagsToMember(
```

## 文面 C: `MemberTagsProvider` interface 内 JSDoc

**対象**: `apps/api/src/repository/memberTags.ts` L94

**before**:

```ts
  assignTagsToMember(mid: MemberId, tagIds: TagId[], assignedBy: string): Promise<number>;
```

**after**:

```ts
  /**
   * **tagQueueResolve workflow 専用 helper。直接呼び出し禁止。**
   * 詳細は同モジュール内 `assignTagsToMember` 関数定義の JSDoc を参照。
   * @internal
   */
  assignTagsToMember(mid: MemberId, tagIds: TagId[], assignedBy: string): Promise<number>;
```

## 文面確定根拠

- `@internal` TSDoc tag は TypeScript / TypeDoc の慣用。API consumers への「直接利用禁止」シグナルとして広く認識される
- 不変条件 #13 を文面に直接引用し、CLAUDE.md の用語と整合
- `tagQueueResolve workflow` の固有名詞を 3 箇所に出すことで `rg "tagQueueResolve workflow"` での grep 検知を可能にする（Phase 2 V-6）
