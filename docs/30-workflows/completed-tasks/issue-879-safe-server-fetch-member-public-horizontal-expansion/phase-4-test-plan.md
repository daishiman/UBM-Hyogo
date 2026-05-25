# Phase 4: テスト計画

## メタ情報

| 項目 | 値 |
|---|---|
| Phase | 4 / 13 |
| テストランナー | vitest（apps/web pkg） |
| カバレッジ目標 | 新規 helper: branch 100% / 新規 SectionError: line 100% |

## 1. テスト一覧

### 1.1 unit: `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`（新規）

| # | ケース | 期待 |
|---|---|---|
| U-1 | thunk resolve | `{ ok: true, data }` |
| U-2 | thunk が Error("X failed: 404") | `{ ok: false, error: { code: "SERVER_FETCH_404", message } }` |
| U-3 | thunk が Error（一般） | `{ ok: false, error: { code: "SERVER_FETCH_FAILED", message } }` |
| U-4 | thunk が non-Error throw | `{ ok: false, error: { code: "SERVER_FETCH_UNKNOWN", message } }` |
| U-5 | codePrefix="ADMIN_FETCH" 指定 | error code が `ADMIN_FETCH_*` |
| U-6 | rethrowOn にマッチする error | re-throw（resolve しない） |
| U-7 | rethrowOn に複数 class 指定・どれか一致 | re-throw |
| U-8 | rethrowOn 未マッチ | `{ ok: false }` |

### 1.2 unit: `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts`（既存維持＋追加）

| # | ケース | 期待 |
|---|---|---|
| A-1 | fetchAdmin success | `{ ok: true, data }` |
| A-2 | "admin api /x failed: 401" | code `ADMIN_FETCH_401`（既存仕様維持） |
| A-3 | 一般 Error | `ADMIN_FETCH_FAILED`（既存維持） |
| A-4 | 共通 lib 経由でも既存 error code 文字列が変わらない | regression gate |

### 1.3 unit: `apps/web/src/components/public/__tests__/SectionError.spec.tsx`（新規）

| # | ケース | assert |
|---|---|---|
| P-1 | props 省略 | 既定 title 描画 |
| P-2 | `detail` 指定 | detail テキスト描画 |
| P-3 | `retryHref` 指定 | `<a href>` 描画 |
| P-4 | a11y | `role="alert"` / `aria-live="polite"` |
| P-5 | token 参照 | className/style に HEX を含まない（`/#[0-9a-f]{3,8}/i` 0 件） |

### 1.4 unit: `apps/web/src/components/member/__tests__/SectionError.spec.tsx`（新規）

P-1〜P-5 と同等 5 ケース。

### 1.5 integration: `apps/web/app/profile/page.spec.tsx`（既存修正）

| # | ケース | assert |
|---|---|---|
| PR-1 | session/profile 両成功 | 通常描画（VisibilitySummary 等） |
| PR-2 | profile fetch 失敗（500） | `<MemberSectionError>` 描画・他セクションは描画継続・error.tsx に行かない |
| PR-3 | session が AuthRequiredError | `redirect("/login")` 呼び出し（re-throw 経路） |
| PR-4 | session/profile 両 500 | session 取得段で素 throw（auth gate 優先）・error.tsx 経路 |
| PR-5 | profile fetch が 404 | `notFound()` 呼び出し（SafeResult code `MEMBER_FETCH_404` 経路） |

### 1.6 integration: `apps/web/app/(public)/members/page.spec.tsx`（新規 or 既存修正）

| # | ケース | assert |
|---|---|---|
| PM-1 | listMembers 成功 | `<MemberGrid>` 描画 |
| PM-2 | listMembers 失敗 | `<PublicSectionError>` 描画・他 UI（DensityToggle / Filters）描画継続 |

### 1.7 integration: `apps/web/app/(public)/members/[id]/page.spec.tsx`（既存修正）

| # | ケース | assert |
|---|---|---|
| PD-1 | fetch 成功 | `<MemberDetail>` 描画 |
| PD-2 | 404（FetchPublicNotFoundError） | `notFound()` 呼び出し（re-throw 経路） |
| PD-3 | 500 等 generic 失敗 | `<PublicSectionError>` 描画・error.tsx に行かない |
| PD-4 | zod parse 失敗 | error.tsx 経路（既存仕様維持） |

## 2. mock 戦略

- `vi.mock("@/lib/fetch/authed")` / `vi.mock("@/lib/fetch/public")` / `vi.mock("@/lib/api/public")`
- `next/navigation` の `redirect` / `notFound` は `vi.mock` で spy
- ライブの `fetch` は触らない

## 3. a11y / 視覚回帰

- 新規 SectionError は既存 token 内に閉じるため、playwright visual baseline 更新は不要
- e2e の axe smoke で critical 0 を維持（既存 task-18 smoke が新規 markup を巡回するため新規 spec 不要）

## 4. 検証コマンド

```bash
mise exec -- pnpm --dir apps/web exec vitest run src/lib/server-fetch
mise exec -- pnpm --dir apps/web exec vitest run src/lib/admin/__tests__/safe-server-fetch.spec.ts
mise exec -- pnpm --dir apps/web exec vitest run src/components/public/__tests__/SectionError.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run src/components/member/__tests__/SectionError.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run app/profile/page.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run "app/(public)/members/page.spec.tsx"
mise exec -- pnpm --dir apps/web exec vitest run "app/(public)/members/[id]/page.spec.tsx"
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 成果物

- 本ファイル

## 完了条件

- 全 AC（AC-1〜AC-8）が少なくとも 1 ケースでカバーされている
- mock 戦略が決まっている
- 検証コマンドが実行可能な形でリスト化されている
