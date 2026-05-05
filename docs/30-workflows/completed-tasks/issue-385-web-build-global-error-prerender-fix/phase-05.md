[実装区分: 実装仕様書]

# Phase 5: 実装ランブック — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 5 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1-4 で確定した **Plan A (lazy factory パターン)** を、将来の実装者（および本タスク内で実装まで実施する Claude Code）が迷わず実行できる step-by-step runbook として確定する。各 step に「対象ファイル」「Before / After コード」「実行コマンド」「期待出力」「想定はまり所」「失敗時 fallback」「DoD」「rollback」を付与する。

本タスクは `[実装区分: 実装仕様書]` であり、CONST_004 デフォルトに従い **本 Phase 内でコード変更まで実施する**（CONST_007 単一サイクル原則）。**commit / push / PR は user 指示後**に別経路で実施する（CONST_005）。

## 真因と方針サマリ（Phase 1-2 引継ぎ）

- 真因: `apps/web/src/lib/auth.ts` における `next-auth` / `next-auth/providers/*` / `next-auth/jwt` / `next-auth/react` の **top-level import** が、Next 16 + React 19 の `/_global-error` `/_not-found` prerender worker で `React.createContext(undefined)` を eager 評価し、Dispatcher 解決順を破壊して `useContext` null エラーを誘発する。
- Plan A: top-level import を **完全撤廃** し、`getAuth()` lazy factory を経由して **route handler 実行時のみ** dynamic import で next-auth をロードする。これにより prerender 経路から next-auth モジュールを物理的に隔離する。
- 既存 export shape (`handlers` / `auth` / `signIn` / `signOut` / `GET` / `POST`) は **互換性維持**（typecheck と既存テストで担保）するが、利用側 (route handler / oauth-client) は `await getAuth()` 経由に書き換える。
- Plan B (`pnpm patch next-auth` で extension 補完 + `serverExternalPackages`) は patch メンテ負荷が高いため **不採用**。Phase 8 fallback として参考保持のみ。

## 委譲方針

| 区分 | 本タスク (issue-385) | 別タスク委譲先 |
| --- | --- | --- |
| 仕様書作成 | 本タスクで完結 | — |
| Plan A 実装（auth.ts / oauth-client.ts / 4 routes / test mock） | **本 Phase で実施** | — |
| build smoke 実測 | Phase 11 で evidence 化 | — |
| L3 source guard CI 組み込み (`rg '^import.*from "next-auth'` 検出 gate) | **委譲** | 別タスク CI guard 追加 |
| staging / production deploy | **委譲** | 09a / 09c |
| commit / push / PR | **委譲（user 承認後）** | Phase 13 / diff-to-pr |

## 前提環境

- Node 24.15.0 / pnpm 10.33.2（`mise exec` 経由必須）
- worktree (`.worktrees/task-20260502-225132-wt-10`) ディレクトリ内で実行
- `.env` の op:// 参照は本 issue の build smoke では不要（環境変数注入なしで build 可能）
- 着手前に `git status` がクリーン、または既存差分が本 issue 関連のみであることを確認

## 変更対象ファイル一覧

| ファイル | 変更分類 | 主な変更 |
| --- | --- | --- |
| `apps/web/src/lib/auth.ts` | refactor | top-level next-auth import 撤廃 / `getAuth()` lazy factory export / `buildAuthConfig` を async 化し provider を dynamic import |
| `apps/web/src/lib/auth/oauth-client.ts` | refactor | `signIn` import を関数内 dynamic import 化 |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | refactor | re-export を `await getAuth()` 経由の handler 関数に置換 |
| `apps/web/app/api/auth/callback/email/route.ts` | refactor | `signIn` import を `await getAuth()` 経由に置換 |
| `apps/web/app/api/admin/[...path]/route.ts` | refactor | `auth` import を `await getAuth()` 経由に置換 |
| `apps/web/app/api/me/[...path]/route.ts` | refactor | `auth` import を `await getAuth()` 経由に置換 |
| `apps/web/app/api/me/[...path]/route.test.ts` | test | `vi.mock("@/lib/auth", ...)` を `getAuth` lazy factory shape に書き換え |
| `apps/web/app/api/auth/callback/email/route.test.ts` | test | 同上 |
| `apps/web/middleware.ts` | 変更なし | `decodeAuthSessionJwt` のみ使用、next-auth 直接 import なし |
| `apps/web/next.config.ts` | 変更なし | `serverExternalPackages` は新たな ESM 解決問題を招くため不採用 |
| `apps/web/package.json` | `build` / `build:cloudflare` に `NODE_ENV=production` を明示 | next / react / react-dom / next-auth の version は据え置き |

---

## 実装ステップ詳細

### Step 1: 着手前 baseline 確認

#### コマンド

```bash
git status --short
git diff --stat
rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts apps/web/src/lib/auth/oauth-client.ts
rg -n 'from "@/lib/auth"|from ".*src/lib/auth"' apps/web/app apps/web/src
```

#### 期待出力

- 既存差分が本 issue 関連のみ（または無し）
- `apps/web/src/lib/auth.ts` が次の top-level import を持つ:
  - `import NextAuth, { type NextAuthConfig } from "next-auth";`
  - `import GoogleProvider from "next-auth/providers/google";`
  - `import CredentialsProvider from "next-auth/providers/credentials";`
  - `import type { JWT } from "next-auth/jwt";`
- `oauth-client.ts` が `import { signIn } from "next-auth/react";` を持つ
- `@/lib/auth` 経由の import 元: route handler 4 ファイル（`[...nextauth]` / `callback/email` / `admin/[...path]` / `me/[...path]`）+ middleware（`decodeAuthSessionJwt` 経由のみで next-auth は触らない）+ test ファイル

#### 想定はまり所

- 想定外の import 元（例: server action / page component から `auth()` を直呼び）が発見された場合は、**Step 6.5** として lazy factory 経由への書き換えを追加する。発見されない前提で進める。

#### DoD

- top-level next-auth import の存在 / 利用側ファイル一覧が確定する

#### rollback

不要（read のみ）。

---

### Step 2: `apps/web/src/lib/auth.ts` の lazy factory 化

最重要 step。`buildAuthConfig` 内部の provider 生成も dynamic import に依存するため、`buildAuthConfig` を **async 化** する。

#### 改修方針

1. top-level の **value import を全削除**:
   - `import NextAuth, { type NextAuthConfig } from "next-auth";`
   - `import GoogleProvider from "next-auth/providers/google";`
   - `import CredentialsProvider from "next-auth/providers/credentials";`
   - `import type { JWT } from "next-auth/jwt";`
2. `NextAuthConfig` / `JWT` の型は **type-only import** 化する（type-only import は TypeScript コンパイル時に erase されるため runtime に next-auth モジュールを引き込まない）:
   ```ts
   import type { NextAuthConfig } from "next-auth";
   import type { JWT } from "next-auth/jwt";
   ```
   ただし `verbatimModuleSyntax` 有効環境で type-only import が runtime side-effect を持たないことを Step 9 (typecheck) で必ず検証する。万一 runtime に引き込まれていることが build smoke で判明した場合は、`type Jwt = Record<string, unknown> | null` / `type AuthConfigShape = unknown` 等のローカル型代替に **降格** する（fallback 経路）。
3. `buildAuthConfig` を `async` 化し、内部で `GoogleProvider` / `CredentialsProvider` を dynamic import:
   ```ts
   const [{ default: GoogleProvider }, { default: CredentialsProvider }] = await Promise.all([
     import("next-auth/providers/google"),
     import("next-auth/providers/credentials"),
   ]);
   ```
4. 末尾の `export const { handlers, auth, signIn, signOut } = NextAuth(...)` および `export const { GET, POST } = handlers;` を **削除**。
5. `getAuth()` lazy factory を新設:
   - 戻り値型 `AuthHandle` を export
   - module-scope `cached: AuthHandle | null` で singleton 化
   - `request?: NextRequest` を受け取り `requestEnv(request)` をマージ可能にする（既存 NextAuth(request => ...) と同一挙動）

#### After（auth.ts 末尾抜粋・参考形）

```ts
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
// ... (cloudflareEnv / globalEnv / processEnv / env / requestEnv / fetchSessionResolve は据え置き)

export const buildAuthConfig = (
  e: AuthEnv = env(),
  fetchImpl: typeof fetch = fetch,
  providers: NextAuthConfig["providers"],
): NextAuthConfig => {
  return {
    trustHost: true,
    ...(e.AUTH_SECRET ? { secret: e.AUTH_SECRET } : {}),
    session: { strategy: "jwt" as const, maxAge: 24 * 60 * 60 },
    jwt: {
      maxAge: SESSION_JWT_TTL_SECONDS,
      encode: async ({ token, secret, maxAge }) =>
        encodeAuthSessionJwt(
          Array.isArray(secret) ? secret[0] ?? "" : secret,
          token,
          maxAge ?? SESSION_JWT_TTL_SECONDS,
        ),
      decode: async ({ token, secret }) =>
        (await decodeAuthSessionJwt(
          Array.isArray(secret) ? secret[0] ?? "" : secret,
          token,
        )) as JWT | null,
    },
    providers,
    pages: { signIn: "/login", error: "/login" },
    callbacks: { /* signIn / jwt / session callback は既存ロジックそのまま */ },
  };
};

type AuthRuntime = ReturnType<typeof import("next-auth").default>;

let authRuntimePromise: Promise<AuthRuntime> | undefined;

const buildProviders = async (e: AuthEnv): Promise<NextAuthConfig["providers"]> => {
  const [{ default: GoogleProvider }, { default: CredentialsProvider }] = await Promise.all([
    import("next-auth/providers/google"),
    import("next-auth/providers/credentials"),
  ]);
  return [
    GoogleProvider({ clientId: googleClientId(e), clientSecret: googleClientSecret(e) }),
    CredentialsProvider({ id: "magic-link", credentials: { verifiedUser: { type: "text" } }, async authorize(credentials) { /* 既存ロジックそのまま */ } }),
  ];
};

export const getAuth = (): Promise<AuthRuntime> => {
  authRuntimePromise ??= (async () => {
    const [{ default: NextAuth }, providers] = await Promise.all([
      import("next-auth"),
      buildProviders(env()),
    ]);
    return NextAuth((request) =>
      buildAuthConfig({ ...env(), ...requestEnv(request) }, fetch, providers),
    );
  })();
  return authRuntimePromise;
};
```

#### コマンド（編集は Edit ツール経由）

```bash
# 編集後の確認
rg -n '^import .* from "next-auth' apps/web/src/lib/auth.ts
rg -n '^import type .* from "next-auth' apps/web/src/lib/auth.ts
rg -n 'export const \{ handlers' apps/web/src/lib/auth.ts
rg -n 'export const \{ GET, POST \}' apps/web/src/lib/auth.ts
rg -n 'export const getAuth' apps/web/src/lib/auth.ts
```

#### 期待出力

- value import (`^import .* from "next-auth`) は **0 hit**（type-only `^import type` のみ hit）
- `export const { handlers, ...` および `export const { GET, POST }` が **0 hit**
- `export const getAuth` が **1 hit**

#### 想定はまり所

| 症状 | 原因仮説 | 対処 |
| --- | --- | --- |
| `NextAuth(config: NextAuthConfig)` 引数型不一致 | provider dynamic import を `buildAuthConfig` に入れて async 化すると型境界が曖昧になる | `buildAuthConfig` は同期関数に固定し、provider 取得だけを `getAuth()` 内の `buildProviders()` に閉じる。局所 `as unknown as NextAuthConfig` は使わない |
| `cached` が dev HMR で stale | `let cached` が module reload で更新されない | dev は `process.env.NODE_ENV !== "production"` 時 `cached` を返さず毎回再生成する分岐を追加（任意） |
| type-only import なのに build で next-auth が引き込まれる | `verbatimModuleSyntax` 未有効 + tsc downlevel | `import type` を維持しつつ Step 9 typecheck → Step 6 build smoke で実証。再現したら型を `unknown` ローカル代替に降格 |
| `JWT` 型を `decode` 戻り値で使用している箇所 | type-only import で OK だが Promise 越しの cast 必要 | 既存 `as JWT \| null` cast はそのまま残す |

#### 失敗時 fallback

- type-only import で build が依然 fail → Step 2.x: `type Jwt = Record<string, unknown> \| null;` 等のローカル型に降格し `import type` を完全削除
- `buildAuthConfig` 既存利用箇所（test）が壊れる → `providers` 引数を明示して同期関数として呼ぶ

#### DoD

- `rg -n '^import .* from "next-auth' apps/web/src/lib/auth.ts` が **0 hit**（type-only 以外）
- `getAuth()` / `AuthHandle` / `buildAuthConfig` (async) / `fetchSessionResolve` / `AuthEnv` がすべて export されている
- 旧 `handlers` / `auth` / `signIn` / `signOut` / `GET` / `POST` の named export は **削除済み**

#### rollback

```bash
git checkout -- apps/web/src/lib/auth.ts
```

---

### Step 3: `apps/web/src/lib/auth/oauth-client.ts` を dynamic import 化

#### Before

```ts
"use client";
import { signIn } from "next-auth/react";

const FALLBACK_REDIRECT = "/profile";

export const signInWithGoogle = async (redirect?: string): Promise<void> => {
  const callbackUrl =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : FALLBACK_REDIRECT;
  await signIn("google", { callbackUrl });
};
```

#### After

```ts
"use client";
// Plan A: top-level "next-auth/react" import を撤廃し、関数内 dynamic import で
// build-time prerender 経路から next-auth モジュールを隔離する (issue-385)。

const FALLBACK_REDIRECT = "/profile";

export const signInWithGoogle = async (redirect?: string): Promise<void> => {
  const callbackUrl =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : FALLBACK_REDIRECT;
  const { signIn } = await import("next-auth/react");
  await signIn("google", { callbackUrl });
};
```

#### コマンド

```bash
rg -n '^import .* from "next-auth/react"' apps/web/src/lib/auth/oauth-client.ts
rg -n 'await import\("next-auth/react"\)' apps/web/src/lib/auth/oauth-client.ts
```

#### 期待出力

- 1 行目: 0 hit
- 2 行目: 1 hit

#### 想定はまり所

- `"use client"` directive は **維持**（client component なので React import は不要だが directive 自体は必要）。
- 他の client component (`apps/web/app/login/...` 等) で `signIn` を直 import している箇所がある場合は、Step 1 の grep で発見し本 Step に追加する。現時点では `oauth-client.ts` のみ。

#### 失敗時 fallback

- なし（PoC で動作確認済み）

#### DoD

- top-level `next-auth/react` import 0 hit
- 関数内 dynamic import 1 hit
- `signInWithGoogle` シグネチャ不変

#### rollback

```bash
git checkout -- apps/web/src/lib/auth/oauth-client.ts
```

---

### Step 4: `apps/web/app/api/auth/[...nextauth]/route.ts` を lazy factory 経由に書き換え

#### Before

```ts
export { GET, POST } from "../../../../src/lib/auth";
```

#### After

```ts
// 05a: Auth.js v5 standard handlers (GET / POST) を lazy factory 経由で公開する route handler。
// `/api/auth/signin/google`, `/api/auth/callback/google`, `/api/auth/session`, `/api/auth/signout` 等を
// 自動的に提供する。Plan A: build-time prerender からの next-auth 隔離のため
// top-level re-export ではなく実行時 await getAuth() で handlers を解決する。
import { getAuth } from "../../../../src/lib/auth";

export async function GET(req: Request): Promise<Response> {
  const { handlers } = await getAuth();
  return handlers.GET(req);
}

export async function POST(req: Request): Promise<Response> {
  const { handlers } = await getAuth();
  return handlers.POST(req);
}
```

#### コマンド

```bash
rg -n 'export \{ GET, POST \} from' apps/web/app/api/auth/'[...nextauth]'/route.ts
rg -n 'await getAuth\(\)' apps/web/app/api/auth/'[...nextauth]'/route.ts
```

#### 期待出力

- 1 行目: 0 hit
- 2 行目: 2 hit (GET / POST)

#### 想定はまり所

- catch-all dynamic segment `[...nextauth]` は path 引数を引き取るが、next-auth handlers が `req` から自前で path を解決するため第二引数 `ctx` は **不要**（既存挙動と同一）。
- 既存テストが `import { GET, POST } from "@/app/api/auth/[...nextauth]/route"` 形式なら継続動作する。

#### 失敗時 fallback

- handlers の signature が `(req: Request) => Promise<Response>` でなく `(req: Request, ctx: ...) => Promise<Response>` だった場合（next-auth 5.x の minor 差異）→ ctx 引数を素通しする。

#### DoD

- 旧 `export { GET, POST } from ...` 0 hit
- `await getAuth()` 2 hit
- 既存 URL contract（`/api/auth/signin/google` 等）変更なし

#### rollback

```bash
git checkout -- apps/web/app/api/auth/'[...nextauth]'/route.ts
```

---

### Step 5: `apps/web/app/api/auth/callback/email/route.ts` を lazy factory 経由に書き換え

#### 改修方針

- top-level `import { signIn } from "../../../../../src/lib/auth";` を **削除**
- `import { getAuth } from "../../../../../src/lib/auth";` に置換
- handler 内で `await signIn(...)` 直前に `const { signIn } = await getAuth();` を追加

#### After 抜粋（変更行のみ）

```ts
import type { NextRequest } from "next/server";
import { getAuth } from "../../../../../src/lib/auth";
import {
  verifyMagicLink,
  mapVerifyReasonToLoginError,
} from "../../../../../src/lib/auth/verify-magic-link";

// ... isValidEmail / isHexToken / loginUrl は既存ロジックそのまま

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const email = url.searchParams.get("email") ?? "";

  if (!token) return Response.redirect(loginUrl(req, "missing_token"), 303);
  if (!email) return Response.redirect(loginUrl(req, "missing_email"), 303);
  if (!isHexToken(token) || !isValidEmail(email)) {
    return Response.redirect(loginUrl(req, "invalid_link"), 303);
  }

  const result = await verifyMagicLink({ token, email });
  if (!result.ok) {
    return Response.redirect(
      loginUrl(req, mapVerifyReasonToLoginError(result.reason)),
      303,
    );
  }

  const { signIn } = await getAuth();
  return (await signIn("magic-link", {
    verifiedUser: JSON.stringify(result.user),
    redirect: true,
    redirectTo: "/",
  })) as Response;
}

export async function POST(): Promise<Response> {
  return new Response("Method Not Allowed", { status: 405 });
}
```

#### コマンド

```bash
rg -n 'import \{ signIn \} from' apps/web/app/api/auth/callback/email/route.ts
rg -n 'await getAuth\(\)' apps/web/app/api/auth/callback/email/route.ts
```

#### 期待出力

- 1 行目: 0 hit
- 2 行目: 1 hit

#### 想定はまり所

- `signIn(...)` の戻り値型は next-auth v5 で `Promise<Response | undefined>` 等揺れがあるため `as Response` cast を追加。typecheck で要調整。
- magic-link verify が成功するまで `getAuth()` を呼ばない順序（既存と同じ）。Plan A の dynamic import コストを失敗パスで支払わない設計。

#### 失敗時 fallback

- typecheck で `signIn` 引数型不一致 → `(signIn as (provider: string, opts: Record<string, unknown>) => Promise<Response>)("magic-link", {...})` の局所キャストで吸収。

#### DoD

- 旧 `import { signIn } from "@/lib/auth"` 0 hit
- `await getAuth()` 1 hit
- magic-link verify 失敗時の早期 return 順序が変わらない

#### rollback

```bash
git checkout -- apps/web/app/api/auth/callback/email/route.ts
```

---

### Step 6: `apps/web/app/api/admin/[...path]/route.ts` を lazy factory 経由に書き換え

#### 改修方針

- top-level `import { auth } from "../../../../src/lib/auth";` を **削除**
- `import { getAuth } from "../../../../src/lib/auth";` に置換
- `requireAdmin()` 内で `const { auth } = await getAuth();` の後 `const session = await auth();`

#### After 抜粋（変更箇所のみ）

```ts
import type { NextRequest } from "next/server";
import { getAuth } from "../../../../src/lib/auth";

// ... apiBase / internalSecret は既存ロジックそのまま

async function requireAdmin(): Promise<Response | null> {
  const { auth } = await getAuth();
  const session = (await auth()) as { user?: { isAdmin?: boolean; memberId?: string } } | null;
  const u = session?.user;
  if (!u || u.isAdmin !== true) {
    return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}

// proxy / GET / POST / PATCH / DELETE export は既存そのまま
```

#### コマンド

```bash
rg -n 'import \{ auth \} from' apps/web/app/api/admin/'[...path]'/route.ts
rg -n 'await getAuth\(\)' apps/web/app/api/admin/'[...path]'/route.ts
```

#### 期待出力

- 1 行目: 0 hit
- 2 行目: 1 hit

#### 想定はまり所

- `auth()` の戻り値型が `Promise<unknown>` のため、既存の `session?.user as { isAdmin?, memberId? }` cast を **`session` 取得直後に格上げ** する（型安全のため）。
- requireAdmin が proxy 内で毎回呼ばれるため `getAuth()` の cached singleton が効くことを Step 9 (lint / typecheck) 通過後に Step 6 (build smoke) で間接確認。

#### 失敗時 fallback

- `auth()` が引数を要求する版の next-auth で型エラー → `await (auth as () => Promise<unknown>)()` で吸収。

#### DoD

- 旧 `import { auth } from "@/lib/auth"` 0 hit
- `await getAuth()` 1 hit
- HTTP method 4 種 (GET/POST/PATCH/DELETE) export が維持

#### rollback

```bash
git checkout -- apps/web/app/api/admin/'[...path]'/route.ts
```

---

### Step 7: `apps/web/app/api/me/[...path]/route.ts` を lazy factory 経由に書き換え

#### 改修方針

Step 6 と同形。`requireSession()` 内で `const { auth } = await getAuth();` を追加。

#### After 抜粋（変更箇所のみ）

```ts
import type { NextRequest } from "next/server";
import { getAuth } from "../../../../src/lib/auth";

// ... apiBase は既存ロジックそのまま

async function requireSession(): Promise<Response | null> {
  const { auth } = await getAuth();
  const session = (await auth()) as { user?: { memberId?: string } } | null;
  const u = session?.user;
  if (!u || !u.memberId) {
    return new Response(JSON.stringify({ code: "UNAUTHENTICATED" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}

// proxy / GET / POST export は既存そのまま
```

#### コマンド

```bash
rg -n 'import \{ auth \} from' apps/web/app/api/me/'[...path]'/route.ts
rg -n 'await getAuth\(\)' apps/web/app/api/me/'[...path]'/route.ts
```

#### 期待出力

- 1 行目: 0 hit
- 2 行目: 1 hit

#### 想定はまり所

- 不変条件 #11（path は session.memberId に依存）の挙動は本 Step では変更しない。`memberId` を URL に組み込まない既存設計を維持。

#### 失敗時 fallback

- Step 6 と同じ局所 cast で吸収。

#### DoD

- 旧 `import { auth } from "@/lib/auth"` 0 hit
- `await getAuth()` 1 hit
- 401 fail-closed 挙動が維持

#### rollback

```bash
git checkout -- apps/web/app/api/me/'[...path]'/route.ts
```

---

### Step 8: 既存テスト mock を `getAuth` lazy factory shape に修正

`vi.mock("@/lib/auth", ...)` を呼んでいる test ファイルを **すべて** lazy factory shape に書き換える。

#### コマンド（対象洗い出し）

```bash
rg -n 'vi\.mock\(["'\'']@/lib/auth["'\'']' apps/web
rg -n 'vi\.mock\(["'\''].*src/lib/auth["'\'']' apps/web
rg -n 'from "@/lib/auth"|from ".*src/lib/auth"' apps/web/app apps/web/src
```

期待される対象（少なくとも以下、Step 1 grep の結果に応じて追加）:

- `apps/web/app/api/me/[...path]/route.test.ts`
- `apps/web/app/api/auth/callback/email/route.test.ts`

#### Before（典型例）

```ts
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
}));
import { auth } from "@/lib/auth";
// ...
(auth as Mock).mockResolvedValue({ user: { memberId: "m1", isAdmin: false } });
```

#### After（典型例）

```ts
const authMock = vi.fn();
const signInMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockResolvedValue({
    auth: authMock,
    signIn: signInMock,
    signOut: signOutMock,
    handlers: { GET: vi.fn(), POST: vi.fn() },
  }),
}));

// テスト内で session を差し替える場合
authMock.mockResolvedValue({ user: { memberId: "m1", isAdmin: false } });
```

#### 想定はまり所

| 症状 | 原因 | 対処 |
| --- | --- | --- |
| `vi.mock` factory 内で外側の `authMock` を参照すると hoisting で `undefined` | vi.mock は file top に hoist される | `vi.hoisted(() => ({ authMock: vi.fn(), ... }))` で hoisted 変数化、または `vi.mock("@/lib/auth", () => ({ getAuth: vi.fn(async () => ({ auth: vi.fn(), signIn: vi.fn(), ... })) }))` で per-call 生成し、テスト内で `vi.mocked(getAuth).mockResolvedValueOnce({...})` で差し替える |
| `signIn` 直 import を mock していたテスト | callback/email test 等 | `getAuth` 経由 mock に統一。`(await getAuth()).signIn` で取得する想定でテストを書き換える |
| import path alias `@/lib/auth` と相対 path 両方が混在 | tsconfig paths と vitest config | `vi.mock` は **両方の path で別 mock 扱い** されるリスクあり。route.ts の import path に合わせて `vi.mock("../../../../src/lib/auth", ...)` 形式に統一するのが確実 |

#### コマンド（修正後）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee /tmp/issue-385-test.log
echo "TEST_EXIT=$?"
```

#### 期待出力

- `TEST_EXIT=0`
- 既存テストが全 PASS（mock 形式変更のみで挙動 assertion は不変）

#### 失敗時 fallback

- vi.hoisted を使う形式に書き換え
- どうしても解消できない 1-2 ケースは `it.skip` で一時的に外し、Phase 6 で再修復（CONST_007 単一サイクル原則上、Phase を跨がず本 Phase 内で復旧することを優先）

#### DoD

- 既存 web vitest スイートが全 PASS
- mock shape が `getAuth: vi.fn().mockResolvedValue({...})` 形式に統一

#### rollback

```bash
git checkout -- apps/web/app/api/me/'[...path]'/route.test.ts apps/web/app/api/auth/callback/email/route.test.ts
```

---

### Step 9: 依存インストール

#### コマンド

```bash
mise exec -- pnpm install --force
```

#### 期待出力

- exit 0
- `pnpm-lock.yaml` 差分なし（package.json 無変更のため）

#### 想定はまり所

- worktree の `node_modules` が古い場合は `--force` で確実に reseed
- prepare script (`lefthook install`) 失敗 → `.git/hooks/*` の手書き残骸を削除して再実行

#### 失敗時 fallback

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
mise exec -- pnpm install --force
```

#### DoD

- 依存が Node 24 / pnpm 10 配下で解決済み

#### rollback

```bash
git checkout -- pnpm-lock.yaml
mise exec -- pnpm install --force
```

---

### Step 10: typecheck

#### コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee /tmp/issue-385-typecheck.log
echo "TYPECHECK_EXIT=$?"
```

#### 期待出力

- `TYPECHECK_EXIT=0`

#### 想定はまり所

| 症状 | 対処 |
| --- | --- |
| `Type 'Promise<NextAuthConfig>' is not assignable to ...` | `buildAuthConfig` を async 化していないか確認し、provider dynamic import を `buildProviders()` に戻す |
| `Property 'auth' does not exist on type AuthRuntime` | `AuthRuntime = ReturnType<typeof import("next-auth").default>` の推論を確認し、独自 `AuthHandle` を増やさない |
| `JWT` type only import が runtime に残っている警告 | `verbatimModuleSyntax` 有効なら `import type` は erase される。tsconfig 確認 |
| route handler の `Request` vs `NextRequest` 不一致 | `Request` で揃える（next-auth handlers は標準 Request を受ける） |

#### 失敗時 fallback

- 局所 `as unknown as ...` キャストで吸収
- `AuthHandle` を `Record<string, unknown>` 風に緩める（最終手段）

#### DoD

- AC-4 が満たされる

#### rollback

Step 2-7 の rollback 手順に準ずる。

---

### Step 11: lint

#### コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 | tee /tmp/issue-385-lint.log
echo "LINT_EXIT=$?"
```

#### 期待出力

- `LINT_EXIT=0`

#### 想定はまり所

- unused import（既存 `NextAuth` / `GoogleProvider` 等の残骸）→ Step 2 で完全削除確認
- `await import(...)` の no-floating-promise / promise/no-misused-promises 系 → `await` 漏れがないか再確認
- `@typescript-eslint/no-explicit-any` → `unknown` に置換

#### 失敗時 fallback

- `pnpm lint --fix` で自動修正、残違反は手修正

#### DoD

- AC-5 が満たされる

#### rollback

Step 2-7 の rollback 手順に準ずる。

---

### Step 12: web vitest（Step 8 の最終確認）

#### コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee /tmp/issue-385-test.log
echo "TEST_EXIT=$?"
```

#### 期待出力

- `TEST_EXIT=0`
- 全 spec PASS（skip / todo は元々あったもののみ）

#### 想定はまり所

- Step 8 の mock 修正漏れ → 失敗 spec の import path と vi.mock path を突き合わせる

#### 失敗時 fallback

Step 8 fallback に戻る。

#### DoD

- AC-9 が満たされる

#### rollback

Step 8 rollback に準ずる。

---

### Step 13: build smoke (Next 標準 build)

#### コマンド

```bash
rm -rf apps/web/.next apps/web/.open-next
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee /tmp/issue-385-build.log
echo "BUILD_EXIT=$?"
grep -n "Cannot read properties of null (reading 'useContext')" /tmp/issue-385-build.log \
  && echo "NG: useContext null re-appeared" \
  || echo "OK: useContext null not found"
```

#### 期待出力

- `BUILD_EXIT=0`
- `useContext` null 文字列 **0 hit**
- 標準出力に `/_global-error` および `/_not-found` が Static / Prerendered 表示
- `apps/web/.next/server/app/_global-error.*` 生成

#### 想定はまり所

| 症状 | 原因仮説 | 対処 |
| --- | --- | --- |
| `useContext` null 再発 | 隠れた top-level `next-auth/react` import が残存 | `rg '^import.*from "next-auth' apps/web/src apps/web/app` で再確認、Step 2-3 を再実行 |
| `Cannot find module 'next-auth'` build エラー | dynamic import path typo | `await import("next-auth")` 文字列を再確認 |
| `getAuth is not a function` runtime | export 漏れ | Step 2 DoD 再確認 |
| `/_not-found` のみ fail | not-found.tsx が client component に退化 | `rg '^"use client"' apps/web/app/not-found.tsx` で 0 hit 確認 |

#### 失敗時 fallback

- top-level next-auth import 残存が真因の場合 → Step 2 / 3 再実行
- それ以外で再発した場合 → Phase 8 fallback (`pnpm patch next-auth` + `serverExternalPackages`) を Phase 6 で再評価。本 Phase 内では Step 13 fail を **記録のみ** にとどめ user 承認を仰ぐ

#### DoD

- AC-1, AC-3 が build log で確認できる

#### rollback

`.next` / `.open-next` は再生成可能。コード差分は Step 2-7 の rollback で復元。

---

### Step 14: build smoke (cloudflare / OpenNext)

#### コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee /tmp/issue-385-build-cf.log
echo "BUILD_CF_EXIT=$?"
ls -la apps/web/.open-next/worker.js
grep -n "Cannot read properties of null (reading 'useContext')" /tmp/issue-385-build-cf.log \
  && echo "NG" \
  || echo "OK"
```

#### 期待出力

- `BUILD_CF_EXIT=0`
- `apps/web/.open-next/worker.js` が **存在**（サイズ > 0）
- `useContext` null 0 hit

#### 想定はまり所

- OpenNext bundling 段階で next-auth が tree-shake されない → dynamic import の文字列 path が静的解析可能なリテラルになっているか確認
- `worker.js` が生成されない → `.open-next` ディレクトリ削除して再実行

#### 失敗時 fallback

Step 13 fallback と同じ。

#### DoD

- AC-2, AC-3 が build:cloudflare log で確認できる

#### rollback

ビルド成果物の再生成のみ。

---

### Step 15: source guard 確認（手動）

#### コマンド

```bash
rg -n '^import .* from "next-auth' apps/web/src/lib/auth.ts && {
  echo "NG: top-level value import remains"
  exit 1
} || echo "OK: lazy factory only"

rg -n '^import .* from "next-auth' apps/web/src apps/web/app | grep -v '^.*:.*import type'
```

#### 期待出力

- 1 行目: `OK: lazy factory only`
- 2 行目: 0 hit（type-only import のみ許容）

#### 委譲

CI / lefthook 統合は別タスク。本 step は手動確認まで。

#### DoD

- AC-6 が手動確認で満たされる

---

## ローカル実行コマンド一覧（順序固定）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
ls -la apps/web/.open-next/worker.js
rg -n '^import .* from "next-auth' apps/web/src/lib/auth.ts
```

## 関数 / コンポーネント シグネチャ

| 対象 | 旧シグネチャ | 新シグネチャ | 副作用 |
| --- | --- | --- | --- |
| `buildAuthConfig` (`src/lib/auth.ts`) | `(e?, fetchImpl?) => NextAuthConfig` | `(e?, fetchImpl?) => Promise<NextAuthConfig>` | provider dynamic import |
| `getAuth` (`src/lib/auth.ts`) | — (新設) | `() => Promise<AuthHandle>` | 初回のみ NextAuth() 評価、以降 cached |
| `AuthHandle` (`src/lib/auth.ts`) | — (新設) | `{ handlers, auth, signIn, signOut }` | 型 |
| `fetchSessionResolve` | `(email, e?, fetchImpl?) => Promise<SessionResolveResponse>` | 不変 | 既存 |
| `signInWithGoogle` (`oauth-client.ts`) | `(redirect?) => Promise<void>` | 不変 | 内部で dynamic import |
| `GET` / `POST` (`api/auth/[...nextauth]/route.ts`) | re-export | `(req: Request) => Promise<Response>` | lazy handler 解決 |

## 入出力

| 入力 | 出力 |
| --- | --- |
| Plan A 改修済み source | `.next/server/app/_global-error.*` / `.next/server/app/_not-found.*` |
| 同上 + OpenNext build | `apps/web/.open-next/worker.js` |
| build stdout | `/tmp/issue-385-build.log` / `/tmp/issue-385-build-cf.log` |
| typecheck / lint / test stdout | `/tmp/issue-385-typecheck.log` / `/tmp/issue-385-lint.log` / `/tmp/issue-385-test.log` |

## テスト方針（Phase 4 連携）

- L1 / L2: build smoke (`pnpm build` / `pnpm build:cloudflare`)
- L3: source guard (`rg '^import .* from "next-auth' apps/web/src/lib/auth.ts` 0 hit)
- L4: typecheck / lint / vitest
- L5: runtime smoke は Phase 11 で別実施（`wrangler dev` / `next start` 任意）

## approval gate（自走禁止）

Claude Code は以下を user 承認なしに実行してはならない:

1. `bash scripts/cf.sh deploy` の staging / production 実行
2. dependency major / minor / patch bump（`next` / `react` / `react-dom` / `next-auth` 全て）
3. `apps/web` 以外のコード変更（`apps/api` / `packages/*` 等）
4. `apps/web/next.config.ts` への `serverExternalPackages` / `experimental.*` 追加
5. `pnpm patch next-auth` 適用
6. commit / push / PR 操作（Phase 13 / user 指示後の diff-to-pr 経路に委ねる）
7. `apps/web/package.json` / `pnpm-lock.yaml` の編集

## DoD（runbook 全体）

- Step 1〜15 がすべて DoD 達成
- AC-1〜AC-6 / AC-9 がローカル実測で満たされる
- AC-7（既存 export shape の機能等価）は typecheck PASS で担保
- AC-8（package.json 無変更）は `git diff -- apps/web/package.json pnpm-lock.yaml` が空であることで担保

## 実行タスク

1. Step 1〜15 の手順・コマンド・期待出力・想定はまり所・失敗時 fallback・DoD・rollback を確定する。
2. 委譲方針を明文化する（実装は本 Phase、CI guard / deploy / commit-push-PR は委譲）。
3. approval gate 7 項目を確定する。
4. Plan A コード変更を Step 2-8 に従って apps/web 配下に実装する。
5. Step 9-15 をローカル実行し AC-1〜AC-6 / AC-9 を実測する。

## 参照資料

- Phase 1-4 の確定事項（特に Phase 2 の Plan A 設計図）
- `apps/web/src/lib/auth.ts`（現行 335 行）
- `apps/web/src/lib/auth/oauth-client.ts`（現行 21 行）
- `apps/web/app/api/auth/[...nextauth]/route.ts`
- `apps/web/app/api/auth/callback/email/route.ts`
- `apps/web/app/api/admin/[...path]/route.ts`
- `apps/web/app/api/me/[...path]/route.ts`
- `apps/web/middleware.ts`（参考、変更なし）
- `apps/web/next.config.ts`（変更なし） / `apps/web/package.json`（build script 環境明示のみ）
- CLAUDE.md（pnpm / mise / lefthook 運用ルール）
- next-auth 5.x docs (`NextAuth(config | factory)` API)
- vercel/next.js issue #86178 / #84994 / #85668 / #87719（同症状）

## 実行手順

- 対象 directory: `apps/web/src/lib/`, `apps/web/src/lib/auth/`, `apps/web/app/api/`
- 仕様書 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- Step 1〜15 を順序通り実行し、failure 発生時は当該 step の fallback で復旧してから次 step へ
- commit / push / PR は user 指示後、Phase 13 / diff-to-pr で実施（本 Phase 内で実行しない）

## 統合テスト連携

- 上流: Phase 4（テスト戦略） — L1〜L5 ピラミッドの根拠
- 下流:
  - Phase 6（異常系）— Step 13 / 14 失敗時の Plan B (`pnpm patch` + `serverExternalPackages`) 評価
  - Phase 9（QA）— typecheck / lint / test / build / build:cloudflare の 5 軸 gate
  - Phase 11（実測）— build smoke evidence の永続化（`outputs/phase-11/build-smoke.md` 等）

## 多角的チェック観点

- 不変条件 #5: `apps/web` のみ変更、`apps/api` / D1 / `packages/*` への侵食ゼロ
- 不変条件 #14: 新規 binding / KV / D1 / cron / secret / variable 追加なし
- 不変条件 #16: build / test ログから secret 文字列を evidence に転記しない（`AUTH_SECRET` 等の値出力禁止）
- 未実装 / 未実測を PASS と扱わない: runbook 整備のみで AC-1 達成と扱わない、Step 13/14 の実測 evidence が必須
- pre-existing バグを根拠に放置しない: Plan A で恒久解消、上流 Next.js patch を待たない
- export shape 互換: 既存 4 route + middleware + test の typecheck PASS で機能等価を担保
- dynamic import の prerender 隔離効果: Step 13 / 14 の build log で `useContext` null 0 hit を必須 evidence 化

## サブタスク管理

- [ ] refs を確認した
- [ ] Step 1-15 の手順を確定した
- [ ] 各 step に DoD と rollback を紐付けた
- [ ] 各 step に想定はまり所と失敗時 fallback を紐付けた
- [ ] 委譲方針を明文化した（実装は本 Phase、CI guard / deploy / commit-push-PR は委譲）
- [ ] approval gate 7 項目を明記した
- [ ] Step 2-8 で Plan A コード変更を apps/web に実装した
- [ ] Step 9-15 でローカル品質 gate を全 PASS した
- [ ] outputs/phase-05/main.md を作成した

## 成果物

- `outputs/phase-05/main.md`（Step 1-15 runbook / 委譲方針 / approval gate / 変更対象ファイル一覧 / 実測コマンド snapshot）
- `apps/web/src/lib/auth.ts`（lazy factory 化済み）
- `apps/web/src/lib/auth/oauth-client.ts`（dynamic import 化済み）
- `apps/web/app/api/auth/[...nextauth]/route.ts` / `callback/email/route.ts` / `admin/[...path]/route.ts` / `me/[...path]/route.ts`（lazy factory 経由化済み）
- 既存 web vitest mock の `getAuth` shape 移行
- ローカル build / typecheck / lint / test ログ（`/tmp/issue-385-*.log`、Phase 11 で永続化）

## 完了条件

- Step 1-15 すべてに「コマンド / 期待出力 / 想定はまり所 / 失敗時 fallback / DoD / rollback」が揃っている
- Plan A コード変更が apps/web 配下に投入されている
- AC-1〜AC-6 / AC-9 が `/tmp/issue-385-*.log` で実測 PASS
- AC-7 / AC-8 が typecheck PASS / `git diff -- apps/web/package.json pnpm-lock.yaml` 空 で担保
- approval gate 7 項目が列挙されている
- commit / push / PR を実施していない

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] commit / push / PR を実行していない
- [ ] dependency 更新（package.json / pnpm-lock.yaml の編集）を実行していない
- [ ] secret 値・実行ログ実値（`AUTH_SECRET` の値等）を記録していない
- [ ] `apps/web` 以外への侵食変更を行っていない

## 次 Phase への引き渡し

Phase 6（異常系検証）へ次を渡す:

- Step 1-15 の runbook（特に Step 13-14 の build smoke と想定はまり所）
- approval gate 7 項目
- 委譲方針（CI guard 統合 / deploy / commit-push-PR は別経路）
- Plan A 実装後の `apps/web/src/lib/auth.ts` 新 export shape (`getAuth` / `AuthHandle` / `buildAuthConfig` async)
- Step 13/14 失敗時の Plan B 移行条件（`pnpm patch next-auth` + `serverExternalPackages` 評価）
- build 成功 ≠ runtime 成功の境界（Phase 6 で magic-link / google OAuth の runtime smoke を扱う）
- dynamic import の cold-start latency 影響（Phase 6 で性能観点として評価）
