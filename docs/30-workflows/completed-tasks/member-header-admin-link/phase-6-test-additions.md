# Phase 6 — Test Additions

## 1. 追加テスト一覧

| ファイル | 追加テスト数 | 種別 |
|---------|--------------|------|
| `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 5 it ブロック（TC-1〜TC-6 + guest fail-closed regression） | Vitest unit |
| `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | 4 it ブロック（guest/member/admin 正規化） | Vitest unit |

## 2. テストフィクスチャ

```ts
const AUTH_VIEW_MEMBER = { kind: "member", profileHref: "/profile" } as const;
const AUTH_VIEW_ADMIN = {
  kind: "admin",
  profileHref: "/profile",
  adminHref: "/admin",
} as const;
```

## 3. 既存テスト regression

- `apps/web/src/components/layout/__tests__/*.spec.tsx` の他テストが壊れていないこと
- 親 workflow Task G の Playwright e2e は本 workflow では走らせない（親側で実行）

## 4. 実行確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/layout/__tests__/MemberHeader.spec.tsx
```

実行済み:

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx
```

結果: `Test Files  2 passed`, `Tests  9 passed`。

## 5. テスト DoD

- [x] TC-1〜TC-7 全 pass
- [x] `expect.fail` / `it[.]skip` / `it[.]todo` 残留なし
- [x] `SignOutButton` の next-auth client action は mock 隔離。描画分岐は props 駆動
