# Phase 6 — テスト拡充

## 1. 追加すべき fail path / 回帰 guard

| ID    | 対象                | ケース                                       | 期待                       |
| ----- | ------------------- | -------------------------------------------- | -------------------------- |
| F6-01 | `safeNext`          | `""`（空文字）                               | `null`                     |
| F6-02 | `safeNext`          | `"   "`（空白のみ・`/` 始まりでない）        | `null`                     |
| F6-03 | `safeNext`          | `"/" + "a".repeat(256)` ちょうど 257文字     | `null`                     |
| F6-04 | `safeNext`          | `"/" + "a".repeat(255)` ちょうど 256文字     | `"/aaa...aaa"`             |
| F6-05 | `page.tsx`          | `getSession()` が throw → page も throw 透過 | （既存仕様確認、追加 spec 不要なら省略） |
| F6-06 | `page.tsx`          | `searchParams.next = ["/a", "/b"]` 配列 → 先頭採用 | `redirect("/a")`        |
| F6-07 | `page.tsx`          | `searchParams.next = "/login?state=sent"`    | `redirect("/profile")`（既存 predicate で自己ループ拒否） |

## 2. 追記方針

Phase 4 の `it.each` テーブルに F6-01〜F6-04 と `/login` 自己ループ拒否を追加（合計 16 ケース）。

```ts
it.each([
  ...,
  ["", null],
  ["   ", null],
  ["/" + "a".repeat(255), "/" + "a".repeat(255)],
  ["/" + "a".repeat(256), null],
])("input %p → %p", (input, expected) => {
  expect(safeNext(input)).toBe(expected);
});
```

## 3. F6-07 メモ

`/login` への redirect 自己ループは `safeNext` が既存 `isSafeInternalRedirect` を再利用して同サイクルで拒否する。未タスク化しない。

## 4. 実行コマンド

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/url/__tests__/safe-next.spec.ts \
  apps/web/app/login/__tests__/page.spec.tsx
```

## 5. DoD

- [ ] `safe-next.spec.ts` 14/14 PASS
- [ ] `page.spec.tsx` 4/4 PASS + F6-06 追加で 5/5
