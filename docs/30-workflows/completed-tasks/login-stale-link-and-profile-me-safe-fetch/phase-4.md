# Phase 4: テスト作成（TDD Red）

## 追加 spec 一覧

### S-1 `apps/web/app/(member)/profile/page.spec.tsx`
**目的**: `/me` fetch が失敗（5xx / network）した場合に Server Components render error にならず SectionError を表示することを assert。

#### Test cases
- `TC-S1-01`: `fetchAuthed` を mock し `FetchAuthedError(500, "boom")` を throw → `SectionError` 要素 (`data-role="retry"`) が render される。
- `TC-S1-02`: `fetchAuthed` を mock し `AuthRequiredError` を throw → `redirect("/login?redirect=/profile")` が呼ばれる（`next/navigation.redirect` を spy）。
- `TC-S1-03`: `fetchAuthed` を mock し正常応答 → 既存通り ProfileHeader が render される。

#### Expected (Red phase)
TC-S1-01 が現状 throw 経路に乗り `Server Components render error` 相当（test harness では未捕捉エラー） → 失敗確認。

### S-2 `apps/web/src/lib/url/{login-query,login-redirect,login-state}.spec.ts`
**目的**: login redirect 正規化が object input を `[object Object]` 化せず `/profile` fallback へ落とすことを検証。

#### Test cases
- `TC-S2-01`: `parseLoginQuery({ redirect: { pathname: "/admin" } })` → `"/profile"`。
- `TC-S2-02`: `toLoginRedirect(object)` → `/login?redirect=%2Fprofile`。
- `TC-S2-03`: `replaceLoginState("sent", object)` → `/login?state=sent&redirect=%2Fprofile`。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  apps/web/app/\(member\)/profile/page.spec.tsx \
  apps/web/src/lib/url/login-query.spec.ts \
  apps/web/src/lib/url/login-redirect.spec.ts \
  apps/web/src/lib/url/login-state.spec.ts
```

## テスト命名規則整合

- `*.spec.tsx` / `*.spec.ts` を使用（不変条件 #8 遵守）
- `__tests__/` 配下に配置（既存パターン）
