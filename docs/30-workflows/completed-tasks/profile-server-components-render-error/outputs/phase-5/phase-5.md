# Phase 5: 実装（TDD Green）

## 5.1 変更対象ファイル

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/lib/fetch/authed.ts` | 編集 | runtime env 解決を `getApiBaseEnv()` 経由へ変更し、`127.0.0.1:8787` fallback を削除、env 未解決時は throw |
| `apps/web/app/(member)/profile/page.tsx` | 編集 | 初回 `/me` 呼び出しを `safeServerFetch` でラップし、`AuthRequiredError` 以外は SectionError UI に降格 |
| `apps/web/src/lib/fetch/authed.spec.ts` | 編集 | `getApiBaseEnv()` 経路 regression を追加 |
| `apps/web/app/(member)/profile/page.spec.tsx` | 新規（既存 `page.spec.tsx` への追記でも可） | `/me` 5xx 時 error UI 返却 / 401 時 redirect の固定 |

## 5.2 実装内容

### `authed.ts`

`resolveApiBase()` を `getApiBaseEnv()` 経由に書き換える:

```ts
import { getApiBaseEnv } from "@/lib/env";

const resolveApiBase = (): string => {
  const env = getApiBaseEnv();
  const internal = env.INTERNAL_API_BASE_URL;
  if (typeof internal === "string" && internal.length > 0) {
    return internal.replace(/\/$/, "");
  }
  const pub = env.PUBLIC_API_BASE_URL;
  if (typeof pub === "string" && pub.length > 0) {
    return pub.replace(/\/$/, "");
  }
  throw new Error(
    "fetchAuthed: neither INTERNAL_API_BASE_URL nor PUBLIC_API_BASE_URL is configured",
  );
};
```

`FALLBACK_INTERNAL_API` 定数および `127.0.0.1:8787` リテラルを完全削除する。

### `profile/page.tsx`

初回 `/me` を `safeServerFetch` でラップする:

```ts
import { safeServerFetch } from "@/lib/server-fetch/safe-fetch";

let meResult: Awaited<ReturnType<typeof safeServerFetch<MeSessionResponse>>>;
try {
  meResult = await safeServerFetch(
    () => fetchAuthed<MeSessionResponse>("/me"),
    { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] },
  );
} catch (err) {
  if (err instanceof AuthRequiredError) {
    return redirect("/login?redirect=/profile");
  }
  throw err;
}
```

`rethrowOn: [AuthRequiredError]` 指定により AuthRequiredError は throw されるため、その上の try/catch または直前で `redirect("/login?redirect=/profile")` を呼ぶ。それ以外（5xx / network error / env 解決失敗）は `meResult.ok === false` として返り、既存 `/me/profile` 失敗経路と同型の SectionError UI で降格表示する。

## 5.3 入出力・副作用契約

| 関数 | 入力 | 正常出力 | 異常時挙動 |
| --- | --- | --- | --- |
| `resolveApiBase()` | env binding | base URL（末尾 `/` 除去済み） | env 未解決時 throw（fail-fast） |
| `fetchAuthed<T>()` | path / init | T | env 解決失敗 / fetch 失敗 / 401 (AuthRequiredError) / その他 !res.ok (FetchAuthedError) で throw |
| `ProfilePage()` | - | JSX | AuthRequiredError → redirect / それ以外の `/me` 失敗 → SectionError UI / 成功 → 既存 profile UI |

## 5.4 ローカル検証

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  "apps/web/app/(member)/profile/page.spec.tsx"
```

期待: 全 spec PASS。

## 5.5 完了条件

- [x] focused Vitest PASS
- [x] `authed.ts` runtime env 解決が `getApiBaseEnv()` 経由
- [x] `FALLBACK_INTERNAL_API` 削除
- [x] `profile/page.tsx` 初回 `/me` が `safeServerFetch` 経由
- [ ] staging deploy 後、`/profile` が 200 で render される（user-gated）
