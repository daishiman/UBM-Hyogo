# Phase 2: 設計

## トポロジー

```
[ Task A: /[object Object] link 検出と修正 ]    [ Task B: /profile /me safeServerFetch 化 ]
        ↓                                              ↓
        ├─ Phase 5 で並列実装可                       ├─ 単一 file 変更（page.tsx 主、error.tsx 副）
        └─ 調査 → 修正 → vitest                       └─ vitest spec で error path 検証
                          ↓
                  Phase 6/7/9 で統合検証
```

## Task A 設計: `[object Object]` 404 link 検出

### 仮説順位
1. **H-A1: `<a href>` / `<Link href>` に object が混入**
   - 候補: コードベース全体を grep（`grep -rn "href={" apps/web/`）して動的式の型不一致を type-narrow する。
   - 既存 grep では login route 内の動的 href は文字列のみ。プロトタイプ／検査対象拡大が必要。

2. **H-A2: 画像／script の preload／preconnect**
   - 候補: layout.tsx の `<Head>`、`metadata.icons`、CSS の `url(...)`。既存 layout.tsx は icons 未指定。

3. **H-A3: third-party script（next-auth client 等）が object を URL として fetch**
   - 候補: `signIn` の callbackUrl に object を渡しているコード経路。`oauth-client.ts` を再点検。

### 設計判定
- まず Phase 4 で **runtime probe**（dev サーバを起動して /login をロードし、curl で `[object Object]` を返している経路を捕捉する diagnostic spec）を追加する代わりに、**静的検査** を第一手段とする。
  - `apps/web/` 配下に対し `grep -rn "href=\\b\\|src=\\b" --include="*.tsx" --include="*.ts" apps/web/app apps/web/src` を回し、動的式に値型ガードを欠く箇所を列挙する。
  - candidate 列挙結果は phase-5 で個別に type-narrow する。
- 修正方針:
  - `<a>` / `<Link>` の href 受け取り側の type を `string` で固定する（既に多くは型化済）。
  - 動的式 `href={someObj}` のような箇所を発見した場合は、既存の `normalizeRedirectPath(value)` 境界へ集約し、文字列以外を `/profile` fallback へ落とす。
    ```ts
    export const assertHrefIsString = (
      value: unknown,
      fallback: string,
    ): string => {
      if (typeof value === "string" && value.length > 0) return value;
      if (process.env.NODE_ENV !== "production") {
        // dev/staging のみ console.warn — production では fallback 黙示返却
        console.warn("[assertHrefIsString] non-string href:", value);
      }
      return fallback;
    };
    ```
  - 発見した動的式が **そもそも文字列前提だった**（=型不変条件違反）場合は、その上流で型を絞り `assertHrefIsString` の使用を限定する。

### Task A 副産物
- 検出工程の出力（grep 結果 + 候補一覧）を `outputs/phase-5/task-a-link-audit.md` に保存。

## Task B 設計: `/profile` `/me` safeServerFetch 化

### Before（現状）

```ts
// apps/web/app/(member)/profile/page.tsx
let me: MeSessionResponse;
try {
  me = await fetchAuthed<MeSessionResponse>("/me");
} catch (err) {
  if (err instanceof AuthRequiredError) {
    return redirect("/login?redirect=/profile");
  }
  throw err; // ← Server Components render error の起点
}
```

### After（修正後）

```ts
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

// AuthRequiredError は safeServerFetch の rethrowOn で投げ直されるため、
// page.tsx の外側で従来通り catch されるよう wrapper を追加する。
```

ただし `safeServerFetch` は `try { thunk } catch { rethrowOn の場合のみ throw }` のため、`AuthRequiredError` は throw されたまま page.tsx 内の上位 catch には届かない（page.tsx 内に `try` が無い）。よって **redirect path を `safeServerFetch` 呼び出しの **外側** で `try/catch` するか、`rethrowOn` を使わずに safeServerFetch の error を判定する** 必要がある。

#### 採用方針

`rethrowOn: [AuthRequiredError]` を使い、page.tsx を `async function` の上位 try/catch でラップする:

```ts
export default async function ProfilePage() {
  let me: MeSessionResponse;
  try {
    me = await fetchAuthedOrShowError(); // ← 新 helper
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return redirect("/login?redirect=/profile");
    }
    return renderSectionError(err);
  }
  ...
}
```

または、より単純に **page.tsx の構造を変えず、`safeServerFetch` の戻り値で SectionError 表示する** パターンを採る（AuthRequiredError だけは rethrowOn で投げ直され、page.tsx の上位 try/catch で redirect する）:

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

このパターンを採用する（後方互換最大、変更幅最小）。

### error.tsx 強化

既存 `apps/web/app/(member)/profile/error.tsx` は digest を表示しているはずだが念のため点検し、未表示なら digest ID 表示を追加する（Phase 5 で diff 確認）。

## 状態所有権

| state | owner |
|-------|-------|
| `me` (MeSessionResponse) | profile/page.tsx ローカル変数 |
| `profileResult.ok` 判定 | profile/page.tsx |
| AuthRequiredError → redirect | profile/page.tsx 上位 try/catch |
| FetchAuthedError → SectionError | profile/page.tsx 内 `meResult.ok === false` 分岐 |

## 採用ライブラリ／API

新規依存なし。既存の `safeServerFetch` / `SectionError` / `MemberHeader` を組み合わせるのみ。
