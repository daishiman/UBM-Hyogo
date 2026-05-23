# Phase 5: API 実装（topTags 集計）

[実装区分: 実装仕様書]

## メタ情報

| Phase | 5 |
| 前提 | Phase 4 完了（テスト red） |
| 後続 | Phase 6 |

## 目的

API 側で `topTags` を集計し、`/public/members` レスポンスに含める。Phase 4 のテストを green にする。

## 変更対象ファイル

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `packages/shared/src/zod/viewmodel.ts` | 編集 | `PublicMemberListViewZ` に `topTags` 追加 |
| `packages/shared/src/types/viewmodel/index.ts` | 編集 | TS 型反映 |
| `apps/api/src/use-cases/public/list-public-members.ts` | 編集 | `aggregateTopTags` 結果を response へ合流 |
| `apps/api/src/repository/publicMembers.ts` | 編集 | D1 集計 SQL |
| `apps/api/src/routes/public/members.ts` | 編集（必要時） | レスポンスに topTags をマージ |
| fixture JSON | 編集 | 各テスト fixture に topTags 値追加 |

## 関数実装

### `aggregateTopTags`

```ts
type TopTag = { code: string; label: string; count: number };

export async function aggregateTopTags(ctx: Ctx): Promise<TopTag[]> {
  const sql = `
    SELECT td.code AS code, td.label AS label, COUNT(DISTINCT mi.member_id) AS count
    FROM member_identities mi
    JOIN member_status s ON s.member_id = mi.member_id
    JOIN member_tags mt ON mt.member_id = mi.member_id
    JOIN tag_definitions td ON td.tag_id = mt.tag_id
    WHERE s.public_consent = 'consented'
      AND s.publish_state = 'public'
      AND s.is_deleted = 0
      AND td.active = 1
      AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)
    GROUP BY td.code, td.label
    ORDER BY count DESC, code ASC
    LIMIT 20
  `;
  const result = await ctx.db.prepare(sql).all<TopTag>();
  return result.results ?? [];
}
```

> **Current anchor**: 現行 repository は `apps/api/src/repository/publicMembers.ts`。公開境界は `member_identities` + `member_status`、tag 結合は `member_tags` + `tag_definitions` を使う。`tags` / `members` 仮称は使わない。

`list-public-members` 内で並列に既存集計と合流:

```ts
const [items, pagination, topTags] = await Promise.all([
  fetchItems(ctx, search),
  fetchPagination(ctx, search),
  aggregateTopTags(ctx),
]);
return { items, pagination, appliedQuery, topTags, generatedAt };
```

## 入出力・副作用

- 入力: `Ctx`（D1 binding）
- 出力: `TopTag[]`、最大 20 件
- 副作用: read-only（write 無し）
- エラーハンドリング: D1 例外は上位で throw（Hono 側 500 化）。空配列は valid。

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/shared test
mise exec -- pnpm --filter @ubm-hyogo/api test -- list-public-members
mise exec -- pnpm --filter @ubm-hyogo/api test -- routes/public/index.contract
mise exec -- pnpm --filter @ubm-hyogo/api dev   # 手動 curl 確認
curl -s http://127.0.0.1:8787/public/members | jq '.topTags | length'
```

## 完了条件（DoD）

- [ ] `pnpm --filter @ubm-hyogo/shared test` green
- [ ] `pnpm --filter @ubm-hyogo/api test` green
- [ ] contract spec の topTags assertion pass
- [ ] curl で `topTags` field が返る
- [ ] `apps/web` の typecheck は依然 fail でも OK（Phase 6 で解消）

## タスク100%実行確認【必須】

- [ ] zod schema に topTags 追加
- [ ] D1 集計クエリ実装
- [ ] 全 fixture 更新

## 次Phase

Phase 6 へ。
