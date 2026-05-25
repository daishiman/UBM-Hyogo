# Phase 9: QA

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 9 / 13 |

## QA チェックリスト

### コード品質

- [ ] `pnpm typecheck` 0 error
- [ ] `pnpm lint` 0 warning（apps/web 配下）
- [ ] `git grep "bg-\\[#" apps/web/src/components/{public,member}` 0 件
- [ ] `git grep "text-\\[#" apps/web/src/components/{public,member}` 0 件
- [ ] 新規 test file が `*.spec.{ts,tsx}` 命名

### 機能契約

- [ ] admin layer の既存 import path（`@/lib/admin/safe-server-fetch`）から `safeServerFetch(path, opts)` で呼び出せる
- [ ] admin 既存 spec が無修正で pass する
- [ ] `/profile` の AuthRequiredError 経路で `redirect("/login")` が呼ばれる
- [ ] `/profile` の profile 取得失敗で SectionError が描画され、page-fatal にならない
- [ ] `/(public)/members` の listMembers 失敗で SectionError 描画＋他 UI 維持
- [ ] `/(public)/members/[id]` の 404 で `notFound()` が呼ばれる
- [ ] `/(public)/members/[id]` の generic 失敗で SectionError 描画

### 不変条件

- [ ] API endpoint 変更なし（`grep -rn "fetch(" apps/api/src/routes` で件数変化なし）
- [ ] D1 直接アクセスなし（apps/web に `D1Database` 型の使用なし）
- [ ] OKLch token 経路のみ使用（HEX 0 件）
- [ ] 新規 primitive 追加なし（既存 token / 既存 class のみ）

### 観測性

- [ ] SafeResult 失敗時の error.message が UI に出る（diagnostics は維持）
- [ ] page-fatal error は error.tsx に到達する（rethrowOn 経路）

## 検証コマンド集約

```bash
mise exec -- pnpm typecheck && \
mise exec -- pnpm lint && \
mise exec -- pnpm --dir apps/web exec vitest run \
  src/lib/server-fetch \
  src/lib/admin/__tests__/safe-server-fetch.spec.ts \
  src/components/public/__tests__/SectionError.spec.tsx \
  src/components/member/__tests__/SectionError.spec.tsx \
  app/profile/page.spec.tsx \
  "app/(public)/members/page.spec.tsx" \
  "app/(public)/members/[id]/page.spec.tsx"
```

## 成果物

- 本ファイル

## 完了条件

- 全 QA 項目がチェック可能な形で列挙されている
