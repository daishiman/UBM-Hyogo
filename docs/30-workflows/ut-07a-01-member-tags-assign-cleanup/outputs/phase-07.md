# Phase 7 — レビュー観点

| # | 観点 | 確認方法 |
| --- | --- | --- |
| 1 | JSDoc 追加 3 箇所と focused boundary tests 以外に diff が混入していない | `git diff apps/api/src/repository/memberTags.ts apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts apps/api/src/repository/__tests__/memberTags.repository.spec.ts` を目視。関数 body / SQL / provider signature に変更がないこと |
| 2 | 関数シグネチャ・interface signature が完全に維持されている | `git diff` で `assignTagsToMember(mid: MemberId, tagIds: TagId[], assignedBy: string): Promise<number>` の引数型・戻り値型を確認 |
| 3 | `@internal` tag が JSDoc 内に含まれる | `rg "@internal" apps/api/src/repository/memberTags.ts` で 2 hit 以上 |
| 4 | 「tagQueueResolve workflow」「直接呼び出し禁止」「不変条件 #13」の 3 キーワードが全部出ている | `rg -c "tagQueueResolve workflow\|直接呼び出し禁止\|不変条件 #13" apps/api/src/repository/memberTags.ts` |
| 5 | 既存 `memberTags.readonly.test-d.ts` の allow list コメントと整合（用語: 「07a tagQueueResolve workflow 専用 helper」） | 両ファイルで同一表現を使っているか |
| 6 | unrelated file diff なし | `git diff --name-only` が `apps/api/src/repository/memberTags.ts`、focused boundary tests、本 workflow docs、aiworkflow sync files のみ |

## 非レビュー対象（明示）

- 関数の SQL 文（変更しない）
- `createMemberTagsProvider` 実装（変更しない）
- `tagQueueResolve.ts` 側（変更しない）
