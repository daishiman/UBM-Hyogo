# Implementation Guide

## Part 1 — 中学生レベルの説明

### なぜ必要か

この作業は、プログラムの部品に「この道具は特別な場面だけで使う」とラベルを貼る作業です。
道具そのものは壊れていないので捨てません。
ただし、だれでも自由に使えるように見えると、あとから別の人が間違った場所で使ってしまいます。

### たとえば

理科室の薬品棚に、先生だけが使う薬品が置いてあるイメージです。
薬品を棚から消す必要はありませんが、「先生の確認がある実験だけで使う」と書いたラベルは必要です。
今回の `assignTagsToMember` も同じで、`tagQueueResolve` という決まった流れからだけ使うと明記します。

### 何が変わるか

プログラムの動きは変わりません。
追加するのは注意書きだけです。
これにより、タグを書き込む正しい入口が `tagQueueResolve` だけだと読み取りやすくなります。

### 今回作ったもの

`memberTags.ts` の先頭に、タグ書き込みの正しい入口を説明するコメントを作りました。
`assignTagsToMember` の直前に、直接呼び出し禁止の注意書きを作りました。
provider の型にも同じ注意書きを付け、型だけ読む人にも意図が伝わるようにしました。

## Part 2 — 技術者向け実装詳細

### 背景

`apps/api/src/repository/memberTags.ts` の冒頭は read-only repository と説明していた一方、同ファイルには `assignTagsToMember` が export されている。
Issue #294 の「production caller なし」前提は現行コードでは stale で、`apps/api/src/workflows/tagQueueResolve.ts` が唯一の production caller である。
したがって削除や rename ではなく、既存 API surface を維持しながら helper 限定性を明文化する。

### 実装ステップ

1. ファイル冒頭コメントを「書き込み API は新規追加禁止」「例外は `assignTagsToMember` のみ」とする。
2. `assignTagsToMember` 関数定義直前に `@internal` 付き JSDoc を追加する。
3. `MemberTagsProvider.assignTagsToMember` 宣言にも同趣旨の JSDoc を追加する。
4. 関数 body、SQL、interface signature、provider factory は変更しない。

### APIシグネチャ

```ts
export async function assignTagsToMember(
  c: DbCtx,
  mid: MemberId,
  tagIds: TagId[],
  assignedBy: string,
): Promise<number>;

export interface MemberTagsProvider {
  assignTagsToMember(mid: MemberId, tagIds: TagId[], assignedBy: string): Promise<number>;
}
```

### 使用例

```ts
// OK: tagQueueResolve workflow 内で provider 経由に集約する
await memberTagsProvider.assignTagsToMember(memberId, tagIds, actorId);

// NG: 新しい route / repository から直接呼び出す
// await assignTagsToMember(c, memberId, tagIds, actorId);
```

直接呼び出しを増やす必要が出た場合は、この helper を横展開しない。
まず `tagQueueResolve` workflow に集約できるかを検討し、不変条件 #13 を変更する必要があるなら別レビューにする。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- tagQueue
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.readonly
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.repository
mise exec -- pnpm --filter @ubm-hyogo/api test -- repository-providers
rg "assignTagsToMember" apps/api/src packages/shared/src
rg -n "tagQueueResolve workflow|直接呼び出し禁止|不変条件 #13|@internal" apps/api/src/repository/memberTags.ts
```

### エラーハンドリング

この実装はコメント/JSDocのみなので、新しい runtime error path は増えない。
検証コマンドが失敗した場合は、`memberTags.ts` の JSDoc/comment と focused boundary tests 以外の差分が混入していないか `git diff apps/api/src/repository/memberTags.ts apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts apps/api/src/repository/__tests__/memberTags.repository.spec.ts` を先に確認する。
Vitest 起動時の esbuild host/binary mismatch は依存インストール状態の問題なので、`pnpm install --frozen-lockfile=false` 後に再実行する。

### エッジケース

JSDoc は実行時の強制力を持たないため、Phase 12 再検証で `memberTags.readonly.test-d.ts` に `assign*` 派生 helper の type-level 禁止 gate を追加した。
これにより `assignTagsToMember` は allow list として維持しつつ、`assignTagsToMemberBulk` などの新規 export は検知される。
caller 増加は grep topology gate で確認する。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| 不変条件 | `#13: タグ書き込みは tagQueueResolve workflow 経由のみ` |
| 正規 production caller | `apps/api/src/workflows/tagQueueResolve.ts` |
| helper marker | `@internal` |
| 禁止 marker | `直接呼び出し禁止` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

### テスト構成

| Test / gate | Purpose |
| --- | --- |
| `pnpm typecheck` | JSDoc追加後も型エラーがないこと |
| `pnpm lint` | コメント/JSDoc追加後も lint が通ること |
| `pnpm --filter @ubm-hyogo/api test -- tagQueue` | queue resolve 経由の既存挙動が壊れていないこと |
| `pnpm --filter @ubm-hyogo/api test -- memberTags.readonly` | repository write keyword gate と `assign*` 派生禁止 gate が維持されること |
| `pnpm --filter @ubm-hyogo/api test -- memberTags.repository` | production caller boundary gate が維持されること |
| `pnpm --filter @ubm-hyogo/api test -- repository-providers` | provider shape が維持されること |
| `rg "assignTagsToMember" apps/api/src packages/shared/src` | production caller が `tagQueueResolve.ts` の 1 箇所に限定されること |
