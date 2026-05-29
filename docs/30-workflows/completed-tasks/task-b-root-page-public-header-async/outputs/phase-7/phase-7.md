# Phase 7: カバレッジ確認

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 7 / 13                      |
| 名称      | カバレッジ確認              |
| 状態      | completed                   |
| 作成日    | 2026-05-28                  |

## 1. カバレッジ対象（変更行限定）

`apps/web/app/page.tsx` の以下の追加・変更行に限定する（広域指定は行わない）。

| 対象                                              | 期待 line | 期待 branch |
| ------------------------------------------------- | --------- | ----------- |
| `await getAuthView()` 行                          | 100%      | n/a         |
| `<PublicHeader authView={authView} />`            | 100%      | n/a         |

## 2. 測定方法

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  --coverage.include='app/page.tsx' \
  app/__tests__/page.spec.tsx
```

> 既存 `getStats` / `listMembersRaw` 分岐は本 task のスコープ外（Phase 1 で scope-in 除外済）のため、カバレッジ対象から除外する。

## 3. 完了条件

- `app/page.tsx` の追加 2 行が line / branch ともに 100%
- TC-01 / TC-02 / TC-03（reject）の3経路がすべて測定対象に含まれる
