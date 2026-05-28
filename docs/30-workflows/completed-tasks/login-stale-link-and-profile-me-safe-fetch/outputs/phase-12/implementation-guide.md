# 実装ガイド: login-stale-link-and-profile-me-safe-fetch

## Part 1: 概念説明（はじめての人向け）

### 何が問題だったの？

ウェブサイトのログインページを開いたとき、ブラウザは画像やリンクをいくつも読み込もうとします。今回、その中に「住所が壊れたリンク」が混ざっていました。プログラムが「次のページの場所」を文字（例: `/profile`）として渡すべきところに、机の引き出しまるごと（オブジェクト）を渡してしまい、ブラウザはそれを文字に変換しようとして `[object Object]` という意味不明な文字列にしてしまいました。結果、`/[object Object]` という存在しない住所に取りに行って 404 エラーが出ていました（問題1）。

もう1つは、ログイン後の「マイページ」を開いたとき、サーバーが裏で「あなたは誰?」という質問を会員データベースに投げます。この問い合わせが失敗したとき、エラーをそのまま投げ捨てていたので、画面全体が「予期せぬエラー」となって何も見えなくなっていました（問題2）。

### どう直したの？

- **問題1**: ログイン redirect を正規化する場所を見直して、「文字以外が来たら安全な代わりの住所に切り替える」既存ガードを強化しました。
- **問題2**: 失敗してもページごと倒れないように、「失敗したら『セッション情報を取得できませんでした』という小さなお知らせカードを出す」仕組み（`safeServerFetch`）でくるみました。これで、ユーザーは「再試行」ボタンを押せます。

## Part 2: 技術詳細

### 変更ファイル

| 種別 | パス |
|------|------|
| 編集 | `apps/web/app/(member)/profile/page.tsx` |
| 編集 | `apps/web/src/lib/url/safe-redirect.ts` |
| 編集 | `apps/web/src/lib/url/login-query.ts` |
| 編集 | `apps/web/src/lib/url/login-redirect.ts` |
| 編集 | `apps/web/src/lib/url/login-state.ts` |
| 編集 | `apps/web/app/login/page.tsx` |
| 編集 spec | `apps/web/app/(member)/profile/page.spec.tsx` |
| 編集 spec | `apps/web/src/lib/url/login-query.spec.ts` |
| 編集 spec | `apps/web/src/lib/url/login-redirect.spec.ts` |
| 編集 spec | `apps/web/src/lib/url/login-state.spec.ts` |
| 点検 | `apps/web/app/(member)/profile/error.tsx` |

### API シグネチャ

```ts
// apps/web/src/lib/url/safe-redirect.ts
export const normalizeRedirectPath: (value: unknown) => string;
// apps/web/src/lib/url/login-redirect.ts
export const toLoginRedirect: (currentPath: unknown) => string;
// apps/web/src/lib/url/login-state.ts
export const replaceLoginState: (state: LoginGateState, redirect: unknown, opts?: ReplaceLoginStateOptions) => void;
```

### `/profile` の `/me` 取得（After）

```ts
const meResult = await safeServerFetch(
  () => fetchAuthed<MeSessionResponse>("/me"),
  { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] },
);
if (!meResult.ok) return <SectionError ... />;
me = meResult.data;
```

`AuthRequiredError` のみ outer try/catch で `/login?redirect=/profile` redirect。

### error code prefix

- 新規: `MEMBER_SESSION_*`（既存: `MEMBER_FETCH`, `ADMIN_FETCH`, `SERVER_FETCH` と整合）

### エッジケース

- `/me` 5xx → SectionError
- `/me` network error → SectionError
- `/me` 401 → redirect
- `/me/profile` 既存挙動温存
- object-shaped login redirect → `/profile` fallback
- generated login URLs → `[object Object]` 不出現

### 視覚証跡

VISUAL_ON_EXECUTION モード。local code/test evidence は取得済み。staging screenshot は `outputs/phase-11/screenshot-plan.json` 参照（staging deploy 後 user capture）。

### ローカル実行

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- app/\\(member\\)/profile/page.spec.tsx src/lib/url/login-query.spec.ts src/lib/url/login-redirect.spec.ts src/lib/url/login-state.spec.ts
```
