# Phase 5: 実装ランブック

## 実装順序

1. `_shared/brand.ts` — branded type re-export
2. `_shared/db.ts` — D1 抽象 interface
3. `_shared/sql.ts` — SQL ヘルパー
4. `members.ts` — member_identities CRUD
5. `identities.ts` — email/id 検索
6. `status.ts` — member_status + deleted_members
7. `responses.ts` — member_responses upsert
8. `responseSections.ts` — セクション read
9. `responseFields.ts` — フィールド read
10. `fieldVisibility.ts` — 可視性 CRUD
11. `memberTags.ts` — タグ read-only
12. `_shared/builder.ts` — ビュー組み立て
13. `__fixtures__/d1mock.ts` — in-memory D1 モック
14. `__fixtures__/members.fixture.ts` — テストデータ
15. `__tests__/` — 各テストファイル

## 実装上の注意

- 全関数は `async` で `Promise<T | null>` を返す
- SQL は named placeholder（`?1`, `?2`, ...）を使用
- `upsertResponse` のみ write API として提供（partial update 禁止）
- `memberTags.ts` は read-only のみ（write API は実装しない）
- `builder.ts` の `buildPublicMemberProfile` は visibility フィルタリングを行う
