# Task D — `/login` のログイン済みリダイレクト + `safeNext()`

**[実装区分: 実装仕様書]**

## 1. 目的

ログイン済みユーザーが `/login` に到達した場合、即座に `/profile`（または `searchParams.next` が安全なら `next`）へリダイレクトする。これにより「ログイン状態と UI 状態の整合」を /login 画面側からも保証する。

## 2. 変更対象ファイル

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/src/lib/url/safeNext.ts` | 新規（純関数） |
| 2 | `apps/web/src/lib/url/__tests__/safeNext.spec.ts` | 新規 |
| 3 | `apps/web/app/login/page.tsx` | 編集（getSession → redirect） |
| 4 | `apps/web/app/login/__tests__/page.spec.tsx` | 編集（既存 spec があれば redirect ケース追加。無ければ最小限の新規） |

## 3. `safeNext` 純関数仕様

```ts
// apps/web/src/lib/url/safeNext.ts
/**
 * `searchParams.next` を安全な内部パスにだけ通すホワイトリストフィルタ。
 *
 * 通す条件:
 *   - 文字列であること
 *   - `/` で始まる
 *   - `//` で始まらない（protocol-relative URL 防止）
 *   - `\` を含まない（IE 互換攻撃面の事前遮断）
 *   - `:` を含まない（`javascript:` 等の防止）
 *   - 長さ 256 文字以下
 *
 * 通らない場合は null を返す（呼出側は `/profile` 等の fallback を使う）。
 */
export function safeNext(raw: unknown): string | null;
```

## 4. `safeNext.spec.ts`（テストケース）

| ID | 入力 | 期待 |
|----|------|------|
| 1 | `"/profile"` | `"/profile"` |
| 2 | `"/admin/members"` | `"/admin/members"` |
| 3 | `"//evil.example.com"` | `null` |
| 4 | `"https://evil.example.com"` | `null` |
| 5 | `"javascript:alert(1)"` | `null` |
| 6 | `"\\evil"` | `null` |
| 7 | `undefined` | `null` |
| 8 | `123` | `null` |
| 9 | `"/" + "a".repeat(300)` | `null` |
| 10 | `["arr"]` | `null` |

## 5. `/login` page 編集

```tsx
import { redirect } from "next/navigation";

import { getSession } from "../../src/lib/session";
import { safeNext } from "../../src/lib/url/safeNext";
// ...

export default async function LoginPage(props: LoginPageProps) {
  const params = (await props.searchParams) ?? {};
  const session = await getSession();
  if (session) {
    const nextRaw = params["next"];
    const next = safeNext(Array.isArray(nextRaw) ? nextRaw[0] : nextRaw);
    redirect(next ?? "/profile");
  }
  const q = parseLoginQuery(params);
  // ...既存処理（LoginCard / LoginPanel 描画）はそのまま
}
```

- `getSession()` は内部で `getAuth()` を呼ぶ。例外時 null を返す既存挙動を信頼する（fail-closed）。
- `redirect()` は Next.js の throw 動作（`NEXT_REDIRECT` Symbol）に依存するため try/catch しない。

## 6. テスト方針

`apps/web/app/login/__tests__/page.spec.tsx`:

1. `getSession()` mock = null → 既存 LoginCard 描画
2. `getSession()` mock = `{ memberId: "m1", email: "x@x", isAdmin: false }`、`searchParams = {}` → `redirect("/profile")` 呼出
3. 同上、`searchParams.next = "/members"` → `redirect("/members")`
4. 同上、`searchParams.next = "//evil"` → `redirect("/profile")`（safeNext で弾かれて fallback）

`redirect` は Next.js が `NEXT_REDIRECT` を throw する仕様なので、Vitest 側で `try/catch` で捕捉して URL 引数を assert する既存パターンを踏襲（既存 `app/(member)/profile/page.spec.tsx` の `redirects when /me requires auth` を参考）。

## 7. ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/url/__tests__/safeNext.spec.ts \
  app/login/__tests__/page.spec.tsx
```

## 8. DoD

- [ ] `safeNext` 純関数 10 ケース pass
- [ ] `/login` でログイン済み + next なし → `/profile` redirect
- [ ] `/login` でログイン済み + 安全 next → `next` へ redirect
- [ ] `/login` でログイン済み + 不正 next → `/profile` fallback
- [ ] `/login` 未ログイン → 既存 LoginCard 描画（regression なし）
- [ ] typecheck / lint green

## 9. 依存

- **Task A 非依存**（`AuthView` を使わず `getSession` のみ）
- 並列実装可
