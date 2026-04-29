# 実装ガイド

## Part 1: 初学者・中学生レベル

### 困りごとと解決後の状態

UBM 兵庫支部会の会員さんは、自分が登録した情報を **見たい** ときがある。「私はちゃんと公開許可してたっけ？」「最後にイベント参加したのいつだっけ？」と気になる。でも、その情報を見るためのドアと、自分のロッカーが今までは存在しなかった。

このタスクで作るのは「ドア」(`/login`) と「ロッカー」(`/profile`) の 2 つ。

### 保健室とロッカーの例え

`/login` と `/profile` は学校の保健室の構造に似ている。

- **`/login` = 保健室に入るためのドア**
  - 生徒証（メールアドレス）か職員証（Google アカウント）で開けられる
  - ドアには 5 種類の貼り紙が出る場合がある:
    1. 「入力待ち」(input) — メアドかボタンを押してください
    2. 「リンク送信済み」(sent) — メールを確認してください
    3. 「未登録です」(unregistered) — 先に入会してください
    4. 「規約同意が必要です」(rules_declined) — Google フォームで再回答してください
    5. 「退会済みです」(deleted) — 管理者に連絡してください
- **`/profile` = あなたのロッカー**
  - 中身を **見ることはできるが、書き換えはできない**
  - 書き換えたいときは、Google フォームで再回答する（先生が許可した正式なやり方）
  - 「ロッカーを開けて中身を編集する」ような button は **一切置かない** — これが不変条件 #4 / #11 のルール

### 専門用語の補足

- **AuthGateState**: 上の 5 種類の貼り紙の名前を英語にしたもの
- **不変条件**: このプロジェクトで「絶対に守らないとダメ」と決められたルール集
- **stableKey**: Google フォームの質問が将来変わっても壊れないように、各質問に貼り直してある不変の「鍵」

### なぜ書き換え禁止？

Google Form が「正本」(マスター) だから。アプリで書き換えを許してしまうと、Google Form と食い違う 2 つの真実ができてしまう。だから書き換え操作は **必ず Google Form 経由** にする。

---

## Part 2: 開発者・技術者レベル

### 概要

apps/web の 2 会員ルート `/login`, `/profile` の責務、URL contract、AuthGateState 5 状態、Server / Client 境界、fetcher、ESLint rule、revalidate 戦略、拡張ガイドを示す。

### ディレクトリ構成

```
apps/web/
├── middleware.ts                    # /profile/:path* で session 必須
├── app/
│   ├── login/
│   │   ├── page.tsx                 # Server: searchParams を loginQuerySchema.safeParse
│   │   ├── _components/
│   │   │   ├── LoginPanel.client.tsx
│   │   │   └── MagicLinkForm.client.tsx
│   │   └── error.tsx
│   ├── profile/
│   │   ├── page.tsx                 # Server: Promise.all([fetchAuthed(/me), fetchAuthed(/me/profile)])
│   │   ├── _components/
│   │   │   ├── StatusSummary.tsx
│   │   │   ├── ProfileFields.tsx
│   │   │   ├── EditCta.tsx
│   │   │   └── AttendanceList.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   └── api/auth/callback/{email,google}/route.ts
└── lib/
    ├── fetch/authed.ts              # fetchAuthed<T>(path, init?)
    ├── auth/{magic-link-client,oauth-client}.ts
    └── url/{login-query,login-redirect,login-state,safe-redirect}.ts
```

### URL contract

```ts
// apps/web/lib/url/login-query.ts
export const loginQuerySchema = z.object({
  state: z.enum(["input","sent","unregistered","rules_declined","deleted"]).default("input"),
  email: z.string().email().optional(),
  redirect: z.string().optional().transform(normalizeRedirectPath),
})
export type LoginQuery = z.infer<typeof loginQuerySchema>
```

- `/login?state=...&email=...&redirect=...`
- `/profile` は query なし（middleware で session 必須）
- 不正値は zod safeParse で `{ state: "input", redirect: "/profile" }` にフォールバック

### AuthGateState 5 状態 × UI

| state | Banner | 主 CTA | 副 CTA |
| --- | --- | --- | --- |
| `input` | なし | MagicLinkForm + GoogleOAuthButton | `/register` link |
| `sent` | success | 「メールをご確認ください」+ 60s cooldown | 別メールで再送 |
| `unregistered` | warn | `/register` ボタン | お問い合わせ |
| `rules_declined` | warn | Google Form responderUrl | `/register` 説明 |
| `deleted` | error | 管理者問い合わせ link | （form 非表示） |

- `LoginPanel.client.tsx` の switch 文で網羅。`@typescript-eslint/switch-exhaustiveness-check` で漏れ防止

### fetcher

```ts
// apps/web/src/lib/fetch/authed.ts
export async function fetchAuthed<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieHeader = await buildCookieHeader()
  const headers = new Headers(init?.headers)
  if (cookieHeader.length > 0) headers.set("cookie", cookieHeader)
  const res = await fetch(`${resolveApiBase()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })
  if (!res.ok) throw new FetchError(res.status, path)
  return res.json() as Promise<T>
}
```

- `/profile` は `Promise.all([fetchAuthed<MeView>("/me"), fetchAuthed<MemberProfile>("/me/profile")])`
- すべて apps/api 経由（不変条件 #5）

### auth client

```ts
// apps/web/src/lib/auth/magic-link-client.ts
export async function sendMagicLink(email: string, redirect: string): Promise<{ state: AuthGateState }>

// apps/web/src/lib/auth/oauth-client.ts
export function signInWithGoogle(redirect: string): void  // フルページ redirect
```

### URL helper

```ts
// apps/web/src/lib/url/login-redirect.ts
export const toLoginRedirect = (currentPath: string) =>
  `/login?redirect=${encodeURIComponent(currentPath)}`

// apps/web/src/lib/url/login-state.ts
export function replaceLoginState(state: AuthGateState, redirect: string): void {
  history.replaceState(null, "", `/login?state=${state}&redirect=${encodeURIComponent(redirect)}`)
}
```

- `replaceLoginState` で submit 後に email を URL から落とす（privacy）

### ESLint rule

```js
{
  rules: {
    "no-restricted-syntax": ["error",
      { selector: "JSXElement[openingElement.name.name='form'][...ProfilePage]", message: "profile に本文編集 form は不可" },
      { selector: "MemberExpression[object.name='localStorage']", message: "localStorage は不採用（不変条件 #8）" },
      { selector: "Literal[value='/no-access']", message: "/no-access は不採用（不変条件 #9）" },
    ],
    "no-restricted-globals": ["error", "UBM"],
    "@typescript-eslint/switch-exhaustiveness-check": "error",
  },
}
```

### revalidate

| route | revalidate | 理由 |
| --- | --- | --- |
| `/login` | static (no fetch) | searchParams のみで gate state を決定、I/O なし |
| `/profile` | `0`（dynamic） | session ベース、毎リクエスト fetch |

### エラーハンドリング・エッジケース

| ケース | 対応 |
| --- | --- |
| `/profile` で 401 | error.tsx → `/login?redirect=/profile` redirect |
| `/profile` で 404（isDeleted=true） | not-found.tsx「アカウントが削除されています」 |
| `editResponseUrl` null | EditCta button disabled + tooltip |
| URL query 不正 | `loginQuerySchema.safeParse` で `input` fallback |
| Magic Link cooldown 中 | button disabled、Toast「60 秒後に再送可」 |

### 設定可能なパラメータ・定数

| 項目 | 値 | 出典 |
| --- | --- | --- |
| `responderUrl` | `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` | CLAUDE.md 固定値 |
| Magic Link cooldown | 60 秒 | 設計決定 |
| middleware matcher | `/profile/:path*` | 設計決定 |

### 実行コマンド・検証コマンド

```bash
pnpm typecheck
pnpm lint
pnpm exec vitest run apps/web/src/lib/url/login-query.test.ts apps/web/src/lib/url/login-redirect.test.ts apps/web/src/lib/url/login-state.test.ts apps/web/src/__tests__/static-invariants.test.ts apps/web/app/login/_components/MagicLinkForm.test.tsx
pnpm dev
curl -I http://localhost:3000/profile     # 302 期待
grep -r "localStorage" apps/web/app/login apps/web/app/profile  # 0 件
pnpm exec vitest run apps/web/src/__tests__/static-invariants.test.ts # /no-access はコメント・検査ルールを除外して 0 件
grep -r "<form" apps/web/app/profile       # 0 件
```

### Phase 11 evidence

2026-04-29 のレビュー改善で `localhost:3001` に対して local partial evidence を取得済み。

| evidence | パス |
| --- | --- |
| `/login` input | `outputs/phase-11/evidence/screenshot/M-01-input.png` |
| `/login?state=sent` | `outputs/phase-11/evidence/screenshot/M-02-sent.png` |
| `/login?state=unregistered` | `outputs/phase-11/evidence/screenshot/M-03-unregistered.png` |
| `/login?state=rules_declined` | `outputs/phase-11/evidence/screenshot/M-04-rules-declined.png` |
| `/login?state=deleted` | `outputs/phase-11/evidence/screenshot/M-05-deleted.png` |
| `/profile` 未ログイン redirect | `outputs/phase-11/evidence/curl/M-07.log` |

`/profile` ログイン後 screenshot と staging smoke は実 session / API fixture / staging deploy が必要なため、`manual-smoke-evidence.md` で pending として管理する。

### 拡張ガイド

- **AuthGateState 追加時**: `loginQuerySchema` の enum、`LoginPanel` の switch case、`auth-gate-state-ui.md` の 3 箇所を同時更新。`switch-exhaustiveness-check` lint が漏れを検出する
- **`editResponseUrl` null 時の文言更新**: `EditCta.tsx` の tooltip と Phase 10 minor M-01 を再 review
- **新しい profile field 追加**: `MemberProfile.fields` に stableKey を追加し、表示名 mapping は 12-search-tags 連携で対応（不変条件 #1）
- **MagicLink cooldown の永続化**: 現状は client state（reload で消失）。永続化が必要になれば URL query で代替（localStorage は不変条件 #8 で禁止）
