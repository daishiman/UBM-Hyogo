# Phase 5: 実装（TDD Green）

## 変更対象ファイル一覧

| 種別 | パス | 目的 |
|------|------|------|
| 編集 | `apps/web/app/(member)/profile/page.tsx` | `/me` fetch を `safeServerFetch` でラップ、5xx で `SectionError` 降下 |
| 編集 | `apps/web/src/lib/url/safe-redirect.ts` | object → `/profile` fallback の type-narrow helper |
| 編集 | `apps/web/src/lib/url/login-query.ts` | Next searchParams 由来の unknown 値を string のみに限定 |
| 編集 | `apps/web/src/lib/url/login-redirect.ts` | `toLoginRedirect` の入力契約を unknown-safe 化 |
| 編集 | `apps/web/src/lib/url/login-state.ts` | `replaceLoginState` の redirect 入力契約を unknown-safe 化 |
| 編集 | `apps/web/app/login/page.tsx` | searchParams 型を unknown-safe に変更 |
| 編集 spec | `apps/web/app/(member)/profile/page.spec.tsx` | S-1 |
| 編集 spec | `apps/web/src/lib/url/login-query.spec.ts` | S-2 |
| 編集 spec | `apps/web/src/lib/url/login-redirect.spec.ts` | S-2 |
| 編集 spec | `apps/web/src/lib/url/login-state.spec.ts` | S-2 |
| 編集（点検） | `apps/web/app/(member)/profile/error.tsx` | digest 表示が存在するか確認、欠落していれば追加 |

## Task A 実装手順

1. **静的検査**:
   ```bash
   grep -rn --include="*.tsx" --include="*.ts" -E "href=\{[^}]*\}|src=\{[^}]*\}" apps/web/app apps/web/src \
     | grep -v "__tests__\|\.spec\." \
     > outputs/phase-5/task-a-href-audit-raw.txt
   ```
2. raw 結果を以下の基準で分類し `outputs/phase-5/task-a-link-audit.md` に表化:
   - **OK**: 値型が `string` リテラル / `string` 確定変数
   - **要修正**: object になりうる型 / `as string` の未検証キャスト / `String(obj)` のような coerce
3. **要修正** 全件に対して、既存 `normalizeRedirectPath(value, fallback)` 境界へ集約する。
4. ログイン経路の集中検査:
   - `apps/web/app/login/` の各 `.tsx` を順に再読し、`<a href>` / `Image` / `signIn` callback が object を受けていないか目視確認
   - `apps/web/src/lib/auth/oauth-client.ts` の `callbackUrl` が string であることを再保証

## Task B 実装手順

`apps/web/app/(member)/profile/page.tsx` の `/me` 取得部を以下に置換:

```ts
let me: MeSessionResponse;
try {
  const meResult = await safeServerFetch(
    () => fetchAuthed<MeSessionResponse>("/me"),
    { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] },
  );
  if (!meResult.ok) {
    return (
      <>
        <MemberHeader />
        <main data-route="member" data-section-rhythm="comfortable">
          <SectionError
            title="セッション情報を取得できませんでした"
            detail={meResult.error.message}
            retryHref="/profile"
          />
        </main>
      </>
    );
  }
  me = meResult.data;
} catch (err) {
  if (err instanceof AuthRequiredError) {
    return redirect("/login?redirect=/profile");
  }
  throw err;
}
```

`/me/profile` 側は既存実装を温存（既に `safeServerFetch` 化済）。

## safe-redirect.ts 実装

```ts
export const normalizeRedirectPath = (value: unknown): string => {
  if (typeof value === "string" && isSafeInternalRedirect(value)) return value;
  return "/profile";
};
```

`toLoginRedirect(currentPath)` と `replaceLoginState(state, redirect, opts)` も `unknown` を受け、`normalizeRedirectPath` を唯一の正規化境界として使う。

## DoD

- [x] S-1 / S-2 focused cases implemented
- [x] 既存 `apps/web` の vitest が全 green（160 files / 1162 tests PASS）
- [x] `pnpm --filter @ubm-hyogo/web typecheck` green
- [x] `pnpm --filter @ubm-hyogo/web lint` green
- [ ] staging deploy 後（user-gated）に `/login` ロードで `/[object Object]` 404 が再現しない
- [ ] staging deploy 後（user-gated）に `/profile` ロードで Server Components render error が再現しない（5xx 時は SectionError が UI に出る）

## ローカル実行

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- app/\\(member\\)/profile/page.spec.tsx src/lib/url/login-query.spec.ts src/lib/url/login-redirect.spec.ts src/lib/url/login-state.spec.ts
```
